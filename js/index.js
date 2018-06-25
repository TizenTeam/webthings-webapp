// -*- mode: js; js-indent-level:2; -*-
// SPDX-License-Identifier: MPL-2.0
/* Copyright 2018-present Samsung Electronics France
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

var app = {};


//TODO enable this if you want to use brower log only for debuging
//app.log = console.log;

app.log = function(arg)
{
  if (arg && arg.name && arg.message) {
    var err = arg;
    this.log("exception [" + err.name + "] msg[" + err.message + "]");
  }
  var text = "log: " + arg + "\n";
  console.log(text);
};

app.handleDocument = function(document)
{
  var parser = new DOMParser();
  //TODO: https://github.com/mozilla-iot/gateway/pull/1142
  //TODO: document.getElementById('token').textContent;
  var xpath = '/html/body/section/div[2]/code/text()';
  var iterator = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null );
  var thisNode = iterator.iterateNext();
  this.log("token: " + thisNode.textContent); //TODO
  localStorage['token'] = thisNode.textContent;
};

app.browse = function(base_url, callback)
{
  var self = this;
  const delay = 50;
  var url = base_url;
  url += '/oauth/authorize' + '?';
  url += '&client_id=' + 'local-token';
  url += '&scope=' + '/things:readwrite';
  url += '&response_type=code';
  this.log("browse: " + url); //TODO
  window.authCount = 0;
  // TODO: check if host alive using xhr
  window.authWin = window.open(url);
  window.interval = setInterval(function () {
    url = (window.authWin && window.authWin.location
           && window.authWin.location.href )
      ? window.authWin.location.href : undefined;
    self.log("wait: " + url); //TODO
    if (url && (url.indexOf('code=') >=0)) {
      self.handleDocument(window.authWin.document);
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

app.get = function(endpoint, callback)
{
  var url = window.form.url.value + endpoint;
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
  } else if (model.type == "multilevelSensor") {
    this.get(model.properties.level.href, function(err, data) {
      view.local.button.innerText = JSON.parse(data).level;
    });
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
  div.appendChild(widget);
  var handlerdiv = document.createElement('div');
  handlerdiv.setAttribute('class', 'ui-switch-handler');
  div.appendChild(handlerdiv);
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
  } else {
    li.setAttribute('class', 'ui-li-static');
    this.log("TODO: implement " + model.type);
  }
  return li;
};

app.query = function(url)
{
  var self = this;
  url = (url) || window.form.url.value;
  this.log("query: " + url);
  this.get("/things", function(err, data) {
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

app.main = function()
{
  if (localStorage['url'] ) window.form.url.value = localStorage['url']
  try {
    this.request();
    this.query();
  } catch(err) {
    this.log(err);
  }
};

window.onload = function() {

  var runButton = document.getElementById('run');
  runButton.addEventListener('click', function() {
    app.main();
  });

  var forgetButton = document.getElementById('forget');
  forgetButton.addEventListener('click', function() {
    localStorage.clear();
    app.log('token forgotten (need auth again)');
  });

  var urlInput = document.getElementById('url');
  urlInput.addEventListener('change', function() {
    this.value = this.value.replace(/\/$/, "");
  });
  // add eventListener for tizenhwkey
  document.addEventListener('tizenhwkey', function(e) {
    if (e.keyName === "back") {
      try {
        tizen.application.getCurrentApplication().exit();
      } catch (ignore) {}
    }
  });
};
