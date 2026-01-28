sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "obsoletetaskform/workflowuimodule/model/models",
  ],
  function (UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend(
      "obsoletetaskform.workflowuimodule.Component",
      {
        metadata: {
          manifest: "json",
        },

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */
        // init: function () {
        //   // call the base component's init function
        //   UIComponent.prototype.init.apply(this, arguments);

        //   // enable routing
        //   this.getRouter().initialize();

        //   // set the device model
        //   this.setModel(models.createDeviceModel(), "device");

        //   this.setTaskModels();

        //   this.getInboxAPI().addAction(
        //     {
        //       action: "APPROVE",
        //       label: "Approve",
        //       type: "accept", // (Optional property) Define for positive appearance
        //     },
        //     function () {
        //       this.completeTask(true);
        //     },
        //     this
        //   );

        //   this.getInboxAPI().addAction(
        //     {
        //       action: "REJECT",
        //       label: "Reject",
        //       type: "reject", // (Optional property) Define for negative appearance
        //     },
        //     function () {
        //       this.completeTask(false);
        //     },
        //     this
        //   );
        // },

        init: function () {
          // base init
          UIComponent.prototype.init.apply(this, arguments);

          // enable routing
          this.getRouter().initialize();

          // device model
          this.setModel(models.createDeviceModel(), "device");

          // task/context models
          this.setTaskModels();

          // === Only SUBMIT action ===
          const submitOutcomeId = "submit";
          this.getInboxAPI().addAction(
            {
              action: submitOutcomeId,
              label: "Submit",
              type: "accept"  // or "default"
            },
            function () {
              // if you need to set flags in context, do it here
              this.completeTask(true, submitOutcomeId);
            },
            this
          );
        },

        setTaskModels: function () {
          // set the task model
          var startupParameters = this.getComponentData().startupParameters;
          this.setModel(startupParameters.taskModel, "task");

          // set the task context model
          var taskContextModel = new sap.ui.model.json.JSONModel(
            this._getTaskInstancesBaseURL() + "/context"
          );
          this.setModel(taskContextModel, "context");
        },

        _getTaskInstancesBaseURL: function () {
          return (
            this._getWorkflowRuntimeBaseURL() +
            "/task-instances/" +
            this.getTaskInstanceID()
          );
        },

        _getWorkflowRuntimeBaseURL: function () {
          var ui5CloudService = this.getManifestEntry("/sap.cloud/service").replaceAll(".", "");
          var ui5ApplicationName = this.getManifestEntry("/sap.app/id").replaceAll(".", "");
          var appPath = `${ui5CloudService}.${ui5ApplicationName}`;
          return `/${appPath}/api/public/workflow/rest/v1`

        },

        // _getWorkflowRuntimeBaseURL: function () {
        //   var appId = this.getManifestEntry("/sap.app/id");
        //   var appPath = appId.replaceAll(".", "/");
        //   var appModulePath = jQuery.sap.getModulePath(appPath);

        //   return appModulePath + "/bpmworkflowruntime/v1";
        // },

        getTaskInstanceID: function () {
          return this.getModel("task").getData().InstanceID;
        },

        getInboxAPI: function () {
          var startupParameters = this.getComponentData().startupParameters;
          return startupParameters.inboxAPI;
        },

        // completeTask: function (approvalStatus) {
        //   this.getModel("context").setProperty("/approved", approvalStatus);
        //   this._patchTaskInstance();
        //   this._refreshTaskList();
        // },

        completeTask: function (approvalStatus, outcomeId) {
          this.getModel("context").setProperty("/approved", approvalStatus);
          if (!this._validateRequiredFields()) {
            return;
          }
          this._patchTaskInstance(outcomeId);
        },

        _validateRequiredFields: function () {
          var oModel = this.getModel("context");
          var aItems = oModel.getProperty("/obsoleteItems") || [];

          var bHandlingRequired = oModel.getProperty("/handlingRequired");
          var bScrapRequired = oModel.getProperty("/scrapRequired");

          for (var i = 0; i < aItems.length; i++) {
            var oItem = aItems[i];

            if (bHandlingRequired) {
              if (!oItem.handling || oItem.handling === "") {
                sap.m.MessageBox.error(
                  "Handling is required. Please fill it for all rows."
                );
                return false;
              }
            }

            if (bScrapRequired) {
              if (!oItem.scrapDecision || oItem.scrapDecision === "") {
                sap.m.MessageBox.error(
                  "Scrapping decision is required. Please fill it for all rows."
                );
                return false;
              }
            }
          }

          return true;
        },


        // _patchTaskInstance: function (outcomeId) {
        //   var data = {
        //     status: "COMPLETED",
        //     context: this.getModel("context").getData(),
        //     decision: outcomeId
        //   };

        //   jQuery.ajax({
        //     url: this._getTaskInstancesBaseURL(),
        //     method: "PATCH",
        //     contentType: "application/json",
        //     async: false,
        //     data: JSON.stringify(data),
        //     headers: {
        //       "X-CSRF-Token": this._fetchToken(),
        //     },
        //   });
        // },

        _patchTaskInstance: function (outcomeId) {
          const context = this.getModel("context").getData();

          const oModel = this.getModel("obsolete");

          const sWorkflowId = context.workflowId;
          const aItems = this.getModel("context").getProperty("/obsoleteItems");

          const oPayload = {
            workflowId: sWorkflowId,
            items: aItems

          }


          oModel.update(`/WorkflowHeader('${sWorkflowId}')`, oPayload, {
            success: function (oData) {
              sap.m.MessageBox.success("Deep update SUCCESS ");
            },
            error: function (oError) {
              sap.m.MessageBox.error("Deep update FAILED");
              console.error("Deep update error:", oError);
            }
          });









          //Run after updating in the DB
          // var data = {
          //   status: "COMPLETED",
          //   context: { ...context, comment: context.comment || '' },
          //   decision: outcomeId
          // };

          // jQuery.ajax({
          //   url: `${this._getTaskInstancesBaseURL()}`,
          //   method: "PATCH",
          //   contentType: "application/json",
          //   async: true,
          //   data: JSON.stringify(data),
          //   headers: {
          //     "X-CSRF-Token": this._fetchToken(),
          //   },
          // }).done(() => {
          //   this._refreshTaskList();
          // })
        },

        _fetchToken: function () {
          var fetchedToken;

          jQuery.ajax({
            url: this._getWorkflowRuntimeBaseURL() + "/xsrf-token",
            method: "GET",
            async: false,
            headers: {
              "X-CSRF-Token": "Fetch",
            },
            success(result, xhr, data) {
              fetchedToken = data.getResponseHeader("X-CSRF-Token");
            },
          });
          return fetchedToken;
        },

        _refreshTaskList: function () {
          this.getInboxAPI().updateTask("NA", this.getTaskInstanceID());
        },
      }
    );
  }
);
