/*global QUnit*/

sap.ui.define([
	"obsoletetaskform/workflow-ui-module/controller/obsoleteTaskForm.controller"
], function (Controller) {
	"use strict";

	QUnit.module("obsoleteTaskForm Controller");

	QUnit.test("I should test the obsoleteTaskForm controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
