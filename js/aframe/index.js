// -*- mode: js; js-indent-level:2; -*-
// SPDX-License-Identifier: MPL-2.0
/* Copyright 2019-present Samsung Electronics France
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/
 */

app.log = function(text)
{
  console.log(text);
}

app.createViewUnknown = function(model)
{
  let view;
  var value = app.el.getAttribute('text', value).value;
  if (model.type) {
    value += "\nTODO: " +  model.type;
  }
  app.el.setAttribute('text', 'value', value);
  return view;
}

app.createViewOnOffSwitch = function (model)
{
  // TODO: implement this
  return app.createViewUnknown(model);
}

app.createViewMultilevelSensor = function (model)
{
  // TODO: implement this
  return app.createViewUnknown(model);
}

app.createView = function(model)
{
  var view;
  console.log(model.type);
  if (model.type === "onOffSwitch"
      || model.type === "dimmableColorLight") {
    return this.createViewOnOffSwitch(model);
  } else if (model.type === "multilevelSensor") {
    return this.createViewMultilevelSensor(model);
  } else {
    return this.createViewUnknown(model);
  }
}

app.query = function(url, token)
{
  let self = this;
  this.get(url, token, function(err, data) {
    let items = data && JSON.parse(data) || [];
    let index;
    for (index=0; index < items.length; index++) {
      let model = items[index];
      model.local = {};
      model.local.view = self.createView(model);
    };
  });
}
