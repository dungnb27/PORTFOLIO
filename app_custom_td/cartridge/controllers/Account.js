"use strict";

var server = require("server");

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.extend(module.superModule);

function getModel(req) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var AccountModel = require('*/cartridge/models/account');
    var AddressModel = require('*/cartridge/models/address');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');

    var orderModel;
    var preferredAddressModel;

    if (!req.currentCustomer.profile) {
        return null;
    }

    var customerNo = req.currentCustomer.profile.customerNo;
    var customerOrders = OrderMgr.searchOrders(
        'customerNo={0} AND status!={1}',
        'creationDate desc',
        customerNo,
        Order.ORDER_STATUS_REPLACED
    );

    var order = customerOrders.first();

    if (order) {
        var currentLocale = Locale.getLocale(req.locale.id);

        var config = {
            numberOfLineItems: 'single'
        };

        orderModel = new OrderModel(order, { config: config, countryCode: currentLocale.country });
    } else {
        orderModel = null;
    }

    if (req.currentCustomer.addressBook.preferredAddress) {
        preferredAddressModel = new AddressModel(req.currentCustomer.addressBook.preferredAddress);
    } else {
        preferredAddressModel = null;
    }

    return new AccountModel(req.currentCustomer, preferredAddressModel, orderModel);
}

server.append("SubmitRegistration", function (req, res, next) {
        var Resource = require("dw/web/Resource");
        var registrationFormObj = res.getViewData();
        if (registrationFormObj.validForm) {
            if (/.+(@yopmail.com)$/.test(registrationFormObj.email.toLowerCase())) {
                registrationFormObj.form.customer.email.valid = false;
                registrationFormObj.form.customer.emailconfirm.valid = false;
                registrationFormObj.form.customer.email.error = Resource.msg( "error.message.yopmail.email","forms",null );
                registrationFormObj.form.customer.emailconfirm.error = Resource.msg( "error.message.yopmail.email","forms",null );  
                registrationFormObj.validForm = false;
                res.setViewData(registrationFormObj);
            }
        }
        next();
    }
);

server.append("EditProfile", function (req, res, next) {
    var Resource = require("dw/web/Resource");
    var viewdata = res.getViewData();
    var accountModel = getModel(req);
    var profileForm = server.forms.getForm('profile');
    profileForm.customer.membershipLevel.value = accountModel.membershipLevel;
    res.setViewData({
		profileForm: profileForm
	});
    next();
}
);

module.exports = server.exports();
