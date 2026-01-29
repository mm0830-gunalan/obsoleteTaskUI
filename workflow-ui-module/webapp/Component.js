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
          const bComponentVisible = oModel.getProperty("/componentVisible");

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

            if (bComponentVisible) {
              if (!oItem.customerResponse || oItem.customerResponse === "") {
                sap.m.MessageBox.error(
                  "Customer Response is required. Please fill it for all rows."
                );
                return false;
              }
            }
          }

          return true;
        },


        _getTaskInstancesStatusURL: function () {
          return (
            this._getWorkflowRuntimeBaseURL() +
            "/task-instances/" +
            this.getTaskInstanceID()
          );
        },

        _checkTaskStatus: function () {

          const sEmail = this.getModel("context")
            .getProperty("/User/email");

          return new Promise((resolve, reject) => {

            jQuery.ajax({
              url: this._getTaskInstancesStatusURL(),
              method: "GET",
              contentType: "application/json",
              headers: {
                "X-CSRF-Token": this._fetchToken()
              },
              success: function (oData) {

                const sStatus = oData.status;
                const sProcessor = oData.processor;

                //  Unclaimed → allowed
                if (sStatus === "READY") {
                  resolve(true);
                  return;
                }

                //  Claimed by current user → allowed
                if (sStatus === "RESERVED" && sProcessor === sEmail) {
                  resolve(true);
                  return;
                }

                //  Claimed by someone else
                if (sStatus === "RESERVED" && sProcessor && sProcessor !== sEmail) {
                  reject(`Task is already RESERVED by ${sProcessor}. Please refresh.`);
                  return;
                }

                //  Completed
                if (sStatus === "COMPLETED") {
                  reject("Task is already COMPLETED. Please refresh.");
                  return;
                }

                //  Fallback (unexpected state)
                reject(`Task is in invalid state: ${sStatus}`);
              },
              error: function () {
                reject("Unable to check task status");
              }
            });

          });
        },


        //Woked for update
        // _patchTaskInstance: async function (outcomeId) {

        //   const oRoot = this.getRootControl();
        //   oRoot.setBusy(true);

        //   try {
        //     // 🔒 1. Check task status first
        //     await this._checkTaskStatus();
        //   } catch (sErrorMsg) {
        //     oRoot.setBusy(false);
        //     sap.m.MessageBox.warning(sErrorMsg);
        //     return;
        //   }

        //   const context = this.getModel("context").getData();
        //   const oModel = this.getModel("obsolete");

        //   const sWorkflowId = context.workflowId;
        //   const aItems = this.getModel("context").getProperty("/obsoleteItems");

        //   aItems.forEach(item => {
        //     if (item.customerResponse === "Customer doesn't pay") {
        //       item.decisionFlow = "Customer doesn't pay";
        //     }
        //   });

        //   const oPayload = {
        //     workflowId: sWorkflowId,
        //     items: aItems
        //   };

        //   // 🔄 2. Update DB (deep update)
        //   try {
        //     await new Promise((resolve, reject) => {
        //       oModel.update(`/WorkflowHeader('${sWorkflowId}')`, oPayload, {
        //         success: resolve,
        //         error: reject
        //       });
        //     });
        //   } catch (oError) {
        //     oRoot.setBusy(false);
        //     sap.m.MessageBox.error("Failed to save data. Task not completed.");
        //     console.error("Deep update error:", oError);
        //     return;
        //   }

        //   // ✅ 3. Complete the task ONLY after DB update succeeds
        //   const data = {
        //     status: "COMPLETED",
        //     context: {
        //       companyCode: context.companyCode,
        //       workflowId: context.workflowId,
        //       workflowName: context.workflowName
        //     },
        //     decision: outcomeId
        //   };

        //   try {
        //     await new Promise((resolve, reject) => {
        //       jQuery.ajax({
        //         url: this._getTaskInstancesBaseURL(),
        //         method: "PATCH",
        //         contentType: "application/json",
        //         data: JSON.stringify(data),
        //         headers: {
        //           "X-CSRF-Token": this._fetchToken()
        //         }
        //       }).done(resolve).fail(reject);
        //     });

        //     // sap.m.MessageBox.success("Task submitted successfully");
        //     this._refreshTaskList();

        //   } catch (oError) {
        //     sap.m.MessageBox.error("Data saved, but task completion failed");
        //     console.error("Task completion error:", oError);
        //   }

        //   // 🧹 4. Clear busy at the very end
        //   oRoot.setBusy(false);
        // },

        _patchTaskInstance: async function (outcomeId) {

          const oRoot = this.getRootControl();
          oRoot.setBusy(true);

          try {
            // 🔒 1. Check task status
            await this._checkTaskStatus();

            const oContextModel = this.getModel("context");
            const context = oContextModel.getData();
            const sWorkflowId = context.workflowId;
            // const aItems = this.getModel("context").getProperty("/obsoleteItems");

            // // ✅ 2. Apply business rule BEFORE save
            // aItems.forEach(item => {
            //   if (item.customerResponse === "Customer doesn't pay") {
            //     item.decisionFlow = "Customer doesn't pay";
            //   }
            // });

            // 🔹 ACTIVE items (visible)
            const aActiveItems = oContextModel.getProperty("/obsoleteItems") || [];

            // 🔹 SOFT-DELETED items (hidden)
            const aDeletedItems = oContextModel.getProperty("/deletedItems") || [];

            //  2. Apply business rule ONLY on active items
            aActiveItems.forEach(item => {
              if (item.customerResponse === "Customer doesn't pay") {
                item.decisionFlow = "Customer doesn't pay";
              }
            });

            // 🔁 3. MERGE active + deleted BEFORE submit
            const aFinalItems = aActiveItems.concat(aDeletedItems);

            //  3. Bulk update via custom CAP action (NO deletes risk)
            await this._callBulkUpdate(sWorkflowId, aFinalItems);
            oContextModel.setProperty("/deletedItems", []);
            //  4. Complete task ONLY after DB update succeeds
            await this._completeTask(outcomeId, context);

            //  Refresh inbox
            this._refreshTaskList();

          } catch (oError) {
            sap.m.MessageBox.error(
              typeof oError === "string" ? oError : "Submit failed"
            );
            console.error(oError);
          } finally {
            // 🧹 Always clear busy
            oRoot.setBusy(false);
          }
        },
        _completeTask: function (outcomeId, context) {

          const data = {
            status: "COMPLETED",
            context: {
              companyCode: context.companyCode,
              workflowId: context.workflowId,
              workflowName: context.workflowName
            },
            decision: outcomeId
          };

          return new Promise((resolve, reject) => {
            jQuery.ajax({
              url: this._getTaskInstancesBaseURL(),
              method: "PATCH",
              contentType: "application/json",
              data: JSON.stringify(data),
              headers: {
                "X-CSRF-Token": this._fetchToken()
              }
            }).done(resolve).fail(reject);
          });
        },
        _callBulkUpdate: function (sWorkflowId, aItems) {

          const oModel = this.getModel("obsolete");
          const csrfToken = oModel.getSecurityToken();
          const serviceUrl = oModel.sServiceUrl;

          return new Promise((resolve, reject) => {
            jQuery.ajax({
              url: `${serviceUrl}/bulkUpdateWorkflowItems`,
              method: "POST",
              contentType: "application/json",
              data: JSON.stringify({
                workflowId: sWorkflowId,
                items: aItems
              }),
              headers: {
                "X-CSRF-Token": csrfToken
              }
            }).done(resolve).fail(reject);
          });
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
