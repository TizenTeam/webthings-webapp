// -*- mode: js; js-indent-level:2; -*-
// SPDX-License-Identifier: MPL-2.0
/* Copyright 2018-present Samsung Electronics France
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

(function() {
 // 'use strict';

  var app = {
    isLoading: true,
    datacontent: document.querySelector('.textarea')
  };

/*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/
  document.getElementById('run').addEventListener('click', function() {
    app.main();
  });

  document.getElementById('forget').addEventListener('click', function() {
    document.form.console.value = '';
    localStorage.clear();
    console.log('token forgotten (need auth again)');
  });

  /*document.getElementById('tizenhwkey').addEventListener('click', function(e) {
    if (e.keyName === "back") {
      try {
        tizen.application.getCurrentApplication().exit();
      } catch (ignore) {}
    }
  }); */
  5
/*****************************************************************************
 *
 * Methods for dealing with the model
 *})();
****************************************************************************/

app.log = function(arg)
{
  if (arg && arg.name && arg.message) {
    var err = arg;
    this.log("exception [" + err.name + "] msg[" + err.message + "]");
  }
  var text = "log: " + arg + "\n";
  console.log(text);
};

app.handleDocument = function(document) {
  var parser = new DOMParser();
  var xpath = '/html/body/section/div[2]/code/text()';
  var iterator = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null );
  var thisNode = iterator.iterateNext();
  this.log("token: " + thisNode.textContent); //TODO
  localStorage['token'] = thisNode.textContent;
};

app.browse = function browse(base_url, callback) {
  var delay = 50;
  var url = base_url;
  url += '/oauth/authorize' + '?';
  url += '&client_id=' + 'local-token';
  url += '&scope=' + '/things:readwrite';
  url += '&st})();ate=asdf';   // ziran -necessary?
  url += '&response_type=code';
  this.log("browse: " + url); //TODO
  window.authCount = 0;
  // TODO: check if host alive using xhr
  window.authWin = window.open(url);
  window.interval = self.setInterval(function () {
    url = (window.authWin && window.authWin.location
           && window.authWin.location.href )
      ? window.authWin.location.href : undefined;
    app.log("wait: " + url); //TODO
    if (url && (url.indexOf('code=') >=0)) {
      app.handleDocument(window.authWin.document);
      window.authCount = 99;
    } else {
      window.authCount++;
    }
    if ( !url || (window.authCount > 60)) {
      window.clearInterval(window.interval);
      if (window.authWin) {
        window.authWin.close();
      }
      if (callback) callback();
    }
  }, delay);
};

app.get = function(endpoint, callback) {
  var url = window.form.url.value + endpoint;
  this.log(url); 
  
  /*
  * Check if the service worker has already cached the sensor
  * data. If the service worker has the data, then display the cached
  * data while the app fetches the latest data.  
  * 
  */

  /* if ('caches' in window) {
  caches.match(url).then(function(response) {
        if (response) {
          response.json().then(function updateFromCache(json) {
            var results = json.query.results;
            results.key = key;
            results.label = label;
            results.created = json.query.created;
            app.updateForecastCard(results);
          });
        }
      });
   } */

  var token = localStorage['token'];
  var request = new XMLHttpRequest();
  request.addEventListener('load', function() {
    callback = callback || {};
    callback(null, this.responseText);
  }); 
 this.log(url); //TODO
  request.open('GET', url);
  request.setRequestHeader('Accept', 'application/json');
  request.setRequestHeader('Authorization', 'Bearer ' + token);
  request.send();
};

app.put = function(endpoint, payload, callback)
{
  var url = window.form.url.value + endpoint;
  var token = localStorage['token'];
  payload = JSON.stringify(payload);
  this.log(url);
  this.log(payload);
  var request = new XMLHttpRequest();
  request.addEventListener('load', function() {
    callback = callback || {};
    callback(null, this.responseText);
  });
    request.open('PUT', url);
  request.setRequestHeader('Content-Type', 'application/json');
  request.setRequestHeader('Accept', 'application/json');
  request.setRequestHeader('Authorization', 'Bearer ' + token);
  request.send(payload);
}

app.updateView = function(model, view)
{
  var self = this;
  if (model.type === "binarySensor"  || model.type === "onOffSwitch") {
    var endpoint = model.properties.on.href;
    this.get(endpoint, function(err, data) {
      view.local.widget.checked = !!(JSON.parse(data).on);
    });
  } else if (model.type === "multiLevelSensor") {
    this.get(model.properties.level.href, function(err, data) {
      view.local.widget.innerText = JSON.parse(data).level;
    });
  } else {
    console.log("TODO: implement " + model.type);
  }
};

app.createBinarySensorView = function(li, model)
{
  var self = this;
  li.setAttribute('class', 'ui-li-static ui-li-1line-btn1');
  var div = document.createElement('div');
  div.setAttribute('class', 'ui-btn.ui-btn-box-s ui-toggle-container');

  var widget = li.local.widget = document.createElement('input');
  widget.setAttribute('type', 'checkbox');
  //TODO: widget.tau = tau.widget.ToggleSwitch(radio);
  widget.setAttribute('class','ui-toggle-switch');
  widget.setAttribute('data-tau-built', "ToggleSwitch");
  widget.setAttribute('data-tau-name', "ToggleSwitch");
  widget.setAttribute('aria-disabled', "false");
  widget.setAttribute('data-tau-bound', "ToggleSwitch");
  var endpoint = model.properties.on.href;
  widget.addEventListener('click', function(){
    widget.disabled = true;
    self.get(model.properties.on.href, function(err, data) {
      widget.disabled = false;
      widget.checked = !! JSON.parse(data).on;
    });
  });
  div.appendChild(widget);
  var handlerdiv = document.createElement('div');
  handlerdiv.setAttribute('class', 'ui-switch-handler');
  div.appendChild(handlerdiv);
  li.appendChild(div);
  return li;
};

app.createOnOffSwitchView = function(li, model)
{
  var self = this;
  li.setAttribute('class', 'ui-li-static ui-li-1line-btn1');
  var div = document.createElement('div');
  div.setAttribute('class', 'ui-btn.ui-btn-box-s ui-toggle-container');

  var widget = li.local.widget = document.createElement('input');
  widget.setAttribute('type', 'checkbox');
  //TODO: widget.tau = tau.widget.ToggleSwitch(widget);
  widget.setAttribute('class','ui-toggle-switch');
  widget.setAttribute('data-tau-built', "ToggleSwitch");
  widget.setAttribute('data-tau-name', "ToggleSwitch");
  widget.setAttribute('aria-disabled', "false");
  widget.setAttribute('data-tau-bound', "ToggleSwitch");
  var endpoint = model.properties.on.href;
  widget.local = {};
  widget.addEventListener('click', function(){
    widget.disabled  = true;
    var wanted = (this.checked);
    widget.local.interval = setTimeout(function(){
      widget.disabled = false;
    }, 1000);
 
    self.log('wanted: ' + wanted);
    self.put(endpoint, { on: wanted }, function(res, data) {
      self.checked  = !! (JSON.parse(data).on)
      clearInterval(widget.local.interval);
      widget.disabled = false;
    });
  });
  div.appendChild(widget);
  var handlerdiv = document.createElement('div');
  handlerdiv.setAttribute('class', 'ui-switch-handler');
  div.appendChild(handlerdiv);
  li.appendChild(div);
  return li;
};

app.createMultiLevelSensorView = function(li, model)
{
  var self = this;
  var widget = li.local.widget = document.createElement('button');
  //widget.tau = tau.widget.Button(widget); //TODO
  widget.setAttribute('class','ui-btn ui-inline');
  widget.setAttribute('data-tau-built', "Button");
  widget.setAttribute('data-tau-name', "Button");
  widget.setAttribute('aria-disabled', "false");
  widget.setAttribute('data-tau-bound', "Button");
  widget.innerText = "?";
  widget.local = {};
  widget.addEventListener('click', function(){
    widget.local.interval = setTimeout(function(){
      if (widget.disabled) {
        self.put(model.properties.on.href, { on: true }, function(err, data) {
          data = JSON.parse(data);
          widget.disabled = false;
          widget.innerText = (data.on) ? "ON" : "OFF";
        });
      }
      widget.disabled = false;
    }, 2000);

    widget.disabled = true;
    self.get(model.properties.on.href, function(err, data) {
      data = JSON.parse(data);
      if (!data.on) {
        widget.innerText = "OFF";
      } else {
        self.get(model.properties.level.href, function(err, data) {
          data = JSON.parse(data);
          clearInterval(widget.local.interval);
          widget.disabled = false;
          widget.innerText = (data) ? data.level : "?";
        });
      }
    });
  });
  li.setAttribute('class', 'ui-li-static ui-li-1line-btn1');
  var div = document.createElement('div');
  div.setAttribute('class', 'ui-btn.ui-btn-box-s ui-toggle-container');
  div.appendChild(widget);
  li.appendChild(div);
  return li;
};

app.createView = function(model)
{
  var li = document.createElement('li');
  li.tau = tau.widget.Listview(li);
  li.value = model.name;
  li.innerText = model.name;
  li.local = {};
  li.local.model = model;

  model.local = {};
  if (model.type === "binarySensor") {
    model.local.view = this.createBinarySensorView(li, model);
  } else if (model.type === "onOffSwitch" || model.type === "dimmableColorLight") {
    model.local.view = this.createOnOffSwitchView(li, model);
  } else if (model.type == "multiLevelSensor") {
    model.local.view = this.createMultiLevelSensorView(li, model);
  } else {
    li.setAttribute('class', 'ui-li-static');
    this.log("TODO: implement " + model.type);
  }
  return li;
};

app.query = function query(url) {
  var self = this;
  url = (url) || window.form.url.value;
  this.log("query: " + url);
  app.get("/things", function(err, data) {
    // Need to check if the app know if it's displaying the latest data
    /* var datacontentElem = document.querySelector(".textarea");
    
    //var dataLastUpdated = datacontentElem.textContent;
   var dataLastUpdated = app.datacontent.textContent;
    if (dataLastUpdated)  {
      dataLastUpdated = new Date(dataLastUpdated);
      // Bail if the textarea has more recent data then the data
      if (dataLastUpdated.getTime() < dataLastUpdated.getTime()) {
        return;
      }
    } */

    /*var items = data && JSON.parse(data) || [];
    for (var index=0; index < items.length; index++) {
      var model = items[index];
      app.log(JSON.stringify(model));
    }; */

    var list = document.getElementById('items');
    list.innerHTML = "";  // Clean list
    var items = data && JSON.parse(data) || [];
    var listWidget;
    for (var index=0; index < items.length; index++) {
      var model = items[index];
      var view = self.createView(model);
      self.updateView(model, view);
      list.appendChild(view);
      listWidget = tau.widget.Listview(list);
      listWidget.refresh();
     };
  });
};

app.request = function()
{
  var self = this;
  var base_url = window.form.url.value;
  if (! localStorage['token']) {
    return this.browse(base_url, function(){
      self.query();
    });
  }
  this.query();
};

app.main = function main() {
  if (localStorage['url'] ) window.form.url.value = localStorage['url']
  try {
    app.request();
    app.query();
  } catch(err) {
    this.log(err);
  }
};

/************************************************************************
   *
   * Code required to start the app
   *
   * NOTE: To simplify this codelab, we've used localStorage.
   *   localStorage is a synchronous API and has serious performance
   *   implications. It should not be used in production applications!
   *   Instead, check out IDB (https://www.npmjs.com/package/idb) or
   *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c)
   ************************************************************************/

  // TODO add service worker code here
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('service-worker.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}
})();
