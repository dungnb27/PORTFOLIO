'use strict';

var Resource = require('dw/web/Resource');

var base = module.superModule;

function account(currentCustomer, addressModel, orderModel) {
    base.call(this, currentCustomer, addressModel, orderModel);
    this.membershipLevel = currentCustomer.raw.profile.custom.membershipLevel_TD;
}

module.exports = account;