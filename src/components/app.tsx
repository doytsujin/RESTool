import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import ConfigService from '../services/config.service';
import { IConfig, IConfigPage } from '../common/models/config.model';
import { Page } from '../components/page/page.comp';
import { Navigation } from '../components/navigation/navigation.comp';
import { AppContext } from './app.context';
import HttpService from '../services/http.service';

import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { CustomStyles } from './customStyles/customStyles.comp';

const httpService = new HttpService();
const defaultAppName: string = 'RESTool App';

function changeFavicon(src: string) {
  const link = document.createElement('link');
  const oldLink = document.getElementById('favicon');
  link.id = 'favicon';
  link.rel = 'shortcut icon';
  link.href = src;
  if (oldLink) {
   document.head.removeChild(oldLink);
  }
  document.head.appendChild(link);
 }

function App() {
  const [firstLoad, setFirstLoad] = useState<boolean>(true);
  const [config, setConfig] = useState<IConfig | null>(null);
  const [activePage, setActivePage] = useState<IConfigPage | null>(config?.pages?.[0] || null);
  const [error, setError] = useState<string | null>(null);

  async function loadConfig(url: string): Promise<void> {
    try {
      const remoteConfig: IConfig = await ConfigService.getRemoteConfig(url);
      
      // Setting global config for httpService
      httpService.baseUrl = remoteConfig.baseUrl || '';
      httpService.errorMessageDataPath = remoteConfig.errorMessageDataPath || '';
      httpService.unauthorizedRedirectUrl = remoteConfig.unauthorizedRedirectUrl || '';
      httpService.requestHeaders = remoteConfig.requestHeaders || {};
      document.title = remoteConfig.name || defaultAppName;

      if (remoteConfig?.favicon) {
        changeFavicon(remoteConfig.favicon);
      }

      if (config?.remoteUrl) {
        return await loadConfig(config.remoteUrl);
      }

      setConfig(remoteConfig);
    } catch (e) {
      console.error('Could not load config file', e);
    }
    
    setFirstLoad(false);
  }

  function scrollToTop(scrollDuration: number = 250) {
    var cosParameter = window.scrollY / 2,
    scrollCount = 0,
    oldTimestamp = performance.now();
    
    function step (newTimestamp: number) {
        scrollCount += Math.PI / (scrollDuration / (newTimestamp - oldTimestamp));
        
        if (scrollCount >= Math.PI) { 
          window.scrollTo(0, 0);
        }

        if (window.scrollY === 0) {
          return;
        }

        window.scrollTo(0, Math.round(cosParameter + cosParameter * Math.cos(scrollCount)));
        oldTimestamp = newTimestamp;
        window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  }

  useEffect(() => {
    loadConfig('./config.json');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { isValid, errorMessage } = ConfigService.validateConfig(config);
    if (!isValid) {
      setError(errorMessage);
      return;
    }
  }, [config]);

  const appName: string = config?.name || defaultAppName;

  return (
    <div className="restool-app">
      {
        !config ? 
        <div className="app-error">
          {firstLoad ? 'Loading Configuration...' : 'Could not find config file.'}
        </div> :
        <AppContext.Provider value={{ config, activePage, setActivePage, error, setError, httpService }}>
          {
            config.customStyles &&
            <CustomStyles 
              styles={config.customStyles} 
            />
          }
          <Router>
            <aside>
              <h1 title={appName} onClick={() => scrollToTop()}>{appName}</h1>
              {
                <Navigation />
              }
            </aside>
            {
              config &&
              <Switch>
                <Route exact path="/:page" component={Page} />
                <Redirect path="/" to={`/${config?.pages?.[0]?.id || '1'}`} />
              </Switch>
            }
            <ToastContainer 
              position={toast.POSITION.TOP_CENTER} 
              autoClose={4000} 
              draggable={false} 
            />
          </Router>
        </AppContext.Provider>
      }
    </div>
  );
}

export default App;
