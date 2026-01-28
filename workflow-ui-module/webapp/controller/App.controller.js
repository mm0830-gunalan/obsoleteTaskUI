sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library"
  ],
  function (BaseController, Spreadsheet, exportLibrary) {
    "use strict";

    return BaseController.extend("obsoletetaskform.workflowuimodule.controller.App", {
      // onInit() {
      // },

      onInit: function () {
        setTimeout(() => {
          const oContextModel = this.getOwnerComponent().getModel("context");

          if (oContextModel.getData() && Object.keys(oContextModel.getData()).length > 0) {
            // Context already loaded
            const ctx = oContextModel.getData();
            this._loadFilteredCAPData(ctx.workflowId, ctx.workflowName);
          }

          oContextModel.attachRequestCompleted(() => {
            const ctx = oContextModel.getData();
            this._loadFilteredCAPData(ctx.workflowId, ctx.workflowName);
          });

        }, 0);

        // this._loadFilteredCAPData("VJHBDJVBD", "Plant")
      },


      _loadFilteredCAPData: function (workflowId, sWorkflowName) {
        const oModel = this.getView().getModel("obsolete");
        const oContextModel = this.getOwnerComponent().getModel("context");
        let oView = this.getView();
        let aFilters = [
          new sap.ui.model.Filter("workflowId", sap.ui.model.FilterOperator.EQ, workflowId)

        ];
        if (sWorkflowName === 'Plant'
        ) {
          aFilters.push(new sap.ui.model.Filter("caused", sap.ui.model.FilterOperator.EQ, "Plant"))
        } else if (sWorkflowName === 'Customer') {
          aFilters.push(new sap.ui.model.Filter("caused", sap.ui.model.FilterOperator.EQ, "Customer"))
        }

        oModel.read("/WorkflowItem", {
          filters: aFilters,
          success: (oData) => {
            console.log("CAP Data:", oData);
            const oResult = oData.results;

            // 1. Create new JSON model
            const oCapModel = new sap.ui.model.json.JSONModel();

            // 2. Save the data under property "obsoleteItems"
            oCapModel.setProperty("/obsoleteItems", oResult);
            oContextModel.setProperty("/obsoleteItems", oResult);

            // 3. Set model to the view with name "capModel"
            oView.setModel(oCapModel, "capModel");
          },
          error: (oError) => {
            console.error("OData error:", oError);
          }
        });
      },

      // onSearch: function (oEvent) {
      //   var sValue = oEvent.getParameter("newValue");
      //   var oTable = this.byId("obsoleteTable");
      //   var oBinding = oTable.getBinding("items");

      //   var aFilters = [];
      //   if (sValue) {
      //     aFilters.push(
      //       new sap.ui.model.Filter({
      //         filters: [
      //           new sap.ui.model.Filter("rfqId", sap.ui.model.FilterOperator.Contains, sValue),
      //           new sap.ui.model.Filter("customer", sap.ui.model.FilterOperator.Contains, sValue),
      //           new sap.ui.model.Filter("caused", sap.ui.model.FilterOperator.Contains, sValue)
      //         ],
      //         and: false
      //       })
      //     );
      //   }

      //   oBinding.filter(aFilters);
      // },

      onSearch: function (oEvent) {
        var sValue = oEvent.getParameter("newValue");
        var oTable = this.byId("obsoleteTable");
        var oBinding = oTable.getBinding("rows"); // ✅ rows, not items

        if (!oBinding) {
          return;
        }

        var aFilters = [];

        if (sValue) {
          aFilters.push(
            new sap.ui.model.Filter({
              filters: [
                new sap.ui.model.Filter("rfqId", sap.ui.model.FilterOperator.Contains, sValue),
                new sap.ui.model.Filter("customer", sap.ui.model.FilterOperator.Contains, sValue),
                new sap.ui.model.Filter("caused", sap.ui.model.FilterOperator.Contains, sValue)
              ],
              and: false // OR condition
            })
          );
        }

        oBinding.filter(aFilters);
      },


      onOpenSortDialog: function () {
        if (!this._oSortDialog) {
          this._oSortDialog = new sap.m.ViewSettingsDialog({
            sortItems: [
              new sap.m.ViewSettingsItem({ key: "rfqId", text: "RFQ ID" }),
              new sap.m.ViewSettingsItem({ key: "customer", text: "Customer" }),
              new sap.m.ViewSettingsItem({ key: "caused", text: "Caused" })
            ],
            confirm: this.onSortConfirm.bind(this)
          });
        }

        this._oSortDialog.open();
      },
      onSortConfirm: function (oEvent) {
        var sKey = oEvent.getParameter("sortItem").getKey();
        var bDesc = oEvent.getParameter("sortDescending");

        var oTable = this.byId("obsoleteTable");
        var oBinding = oTable.getBinding("rows"); // ✅ rows, not items

        if (!oBinding) {
          return;
        }

        var oSorter = new sap.ui.model.Sorter(sKey, bDesc);
        oBinding.sort(oSorter);

        // Optional: clear selection after sort
        oTable.clearSelection();
      },

      // onSortConfirm: function (oEvent) {
      //   var sKey = oEvent.getParameter("sortItem").getKey();
      //   var bDesc = oEvent.getParameter("sortDescending");

      //   var oTable = this.byId("obsoleteTable");
      //   var oBinding = oTable.getBinding("items");

      //   var oSorter = new sap.ui.model.Sorter(sKey, bDesc);
      //   oBinding.sort(oSorter);
      // },


      // onUpdateHandling: function () {
      //   var oTable = this.byId("obsoleteTable");
      //   this._aSelectedItems = oTable.getSelectedItems();

      //   if (!this._aSelectedItems.length) {
      //     sap.m.MessageToast.show("Please select at least one row");
      //     return;
      //   }

      //   if (!this._oHandlingDialog) {
      //     this._oHandlingDialog = sap.ui.xmlfragment(
      //       "obsoletetaskform.workflowuimodule.view.fragment.HandlingUpdate",
      //       this
      //     );
      //     this.getView().addDependent(this._oHandlingDialog);
      //   }

      //   sap.ui.getCore().byId("massHandlingSelect").setSelectedKey("");
      //   this._oHandlingDialog.open();
      // },

      onUpdateHandling: function () {
        var oTable = this.byId("obsoleteTable");
        var aSelectedIndices = oTable.getSelectedIndices();

        if (!aSelectedIndices.length) {
          sap.m.MessageToast.show("Please select at least one row");
          return;
        }

        this._aSelectedContexts = [];

        aSelectedIndices.forEach(function (iIndex) {
          var oContext = oTable.getContextByIndex(iIndex);
          if (oContext) {
            this._aSelectedContexts.push(oContext);
          }
        }.bind(this));

        if (!this._oHandlingDialog) {
          this._oHandlingDialog = sap.ui.xmlfragment(
            "obsoletetaskform.workflowuimodule.view.fragment.HandlingUpdate",
            this
          );
          this.getView().addDependent(this._oHandlingDialog);
        }

        sap.ui.getCore().byId("massHandlingSelect").setSelectedKey("");
        this._oHandlingDialog.open();
      },

      onCancelHandlingDialog: function () {
        this._oHandlingDialog.close();
      },


      onApplyHandlingUpdate: function () {
        var sSelectedHandling = sap.ui.getCore()
          .byId("massHandlingSelect")
          .getSelectedKey();

        if (!sSelectedHandling) {
          sap.m.MessageToast.show("Please select Handling value");
          return;
        }

        // ✅ Loop over selected binding contexts
        this._aSelectedContexts.forEach(function (oContext) {
          oContext.getModel().setProperty(
            oContext.getPath() + "/handling",
            sSelectedHandling
          );
        });
        this.byId("obsoleteTable").clearSelection();
        this._oHandlingDialog.close();
        sap.m.MessageToast.show("Handling updated successfully");
      },



      //For updating the Scrapping

      onUpdateScrap: function () {
        var oTable = this.byId("obsoleteTable");
        var aSelectedIndices = oTable.getSelectedIndices();

        if (!aSelectedIndices.length) {
          sap.m.MessageToast.show("Please select at least one row");
          return;
        }

        this._aSelectedContexts = [];

        aSelectedIndices.forEach(function (iIndex) {
          var oContext = oTable.getContextByIndex(iIndex);
          if (oContext) {
            this._aSelectedContexts.push(oContext);
          }
        }.bind(this));

        if (!this._oScrapDialog) {
          this._oScrapDialog = sap.ui.xmlfragment(
            "obsoletetaskform.workflowuimodule.view.fragment.ScrapUpdate",
            this
          );
          this.getView().addDependent(this._oScrapDialog);
        }

        sap.ui.getCore().byId("massHandlingSelectScrap").setSelectedKey("");
        this._oScrapDialog.open();
      },

      onCancelScrapDialog: function () {
        this._oScrapDialog.close();
      },


      onApplyScrapUpdate: function () {
        var sSelectedHandling = sap.ui.getCore()
          .byId("massHandlingSelectScrap")
          .getSelectedKey();

        if (!sSelectedHandling) {
          sap.m.MessageToast.show("Please select Scrapping value");
          return;
        }

        // ✅ Loop over selected binding contexts
        this._aSelectedContexts.forEach(function (oContext) {
          oContext.getModel().setProperty(
            oContext.getPath() + "/scrapDecision",
            sSelectedHandling
          );
        });
        this.byId("obsoleteTable").clearSelection();
        this._oScrapDialog.close();
        sap.m.MessageToast.show("Scrapping updated successfully");
      },

      // onApplyHandlingUpdate: function () {
      //   var sSelectedHandling = sap.ui.getCore()
      //     .byId("massHandlingSelect")
      //     .getSelectedKey();

      //   if (!sSelectedHandling) {
      //     sap.m.MessageToast.show("Please select Handling value");
      //     return;
      //   }

      //   this._aSelectedItems.forEach(function (oItem) {
      //     var oCtx = oItem.getBindingContext("context");
      //     oCtx.getObject().handling = sSelectedHandling;
      //   });

      //   this.getView().getModel("context").refresh(true);

      //   this._oHandlingDialog.close();

      //   sap.m.MessageToast.show("Handling updated successfully");
      // },
      // onOpenFilterDialog: function () {
      //   if (!this._oFilterDialog) {
      //     this._oFilterDialog = new sap.m.ViewSettingsDialog({
      //       title: "Filter",
      //       filterItems: [
      //         new sap.m.ViewSettingsFilterItem({
      //           text: "Plant",
      //           key: "plant",
      //           items: [
      //             new sap.m.ViewSettingsItem({ text: "1000", key: "1000" }),
      //             new sap.m.ViewSettingsItem({ text: "2000", key: "2000" })
      //           ]
      //         }),
      //         new sap.m.ViewSettingsFilterItem({
      //           text: "Customer",
      //           key: "customer",
      //           items: [
      //             new sap.m.ViewSettingsItem({ text: "TATA", key: "TATA" }),
      //             new sap.m.ViewSettingsItem({ text: "BMW", key: "BMW" })
      //           ]
      //         }),
      //         new sap.m.ViewSettingsFilterItem({
      //           text: "Handling",
      //           key: "handling",
      //           items: [
      //             new sap.m.ViewSettingsItem({ text: "Scrapping", key: "Scrapping" }),
      //             new sap.m.ViewSettingsItem({ text: "Alternative use", key: "Alternative use" })
      //           ]
      //         })
      //       ],
      //       confirm: this.onFilterConfirm.bind(this)
      //     });
      //   }

      //   this._oFilterDialog.open();
      // },
      onOpenFilterDialog: function () {
        const oModel = this.getView().getModel("context");
        const aItems = oModel.getProperty("/obsoleteItems");

        // Helper to extract unique values from an array
        const getUnique = (array, field) => {
          const set = new Set(array.map(item => item[field]));
          return Array.from(set).filter(x => x !== undefined && x !== null);
        };

        // Extract unique values
        const aPlants = getUnique(aItems, "plant");
        const aCustomers = getUnique(aItems, "customer");
        // const aHandling = getUnique(aItems, "handling");

        if (!this._oFilterDialog) {
          this._oFilterDialog = new sap.m.ViewSettingsDialog({
            title: "Filter",
            confirm: this.onFilterConfirm.bind(this)
          });

          // --- PLANT FILTER ---
          const oPlantFilter = new sap.m.ViewSettingsFilterItem({
            text: "Plant",
            key: "plant"
          });

          aPlants.forEach(p => {
            oPlantFilter.addItem(new sap.m.ViewSettingsItem({ text: p, key: p }));
          });

          // --- CUSTOMER FILTER ---
          const oCustomerFilter = new sap.m.ViewSettingsFilterItem({
            text: "Customer",
            key: "customer"
          });

          aCustomers.forEach(c => {
            oCustomerFilter.addItem(new sap.m.ViewSettingsItem({ text: c, key: c }));
          });



          // Add to dialog
          this._oFilterDialog.addFilterItem(oPlantFilter);
          this._oFilterDialog.addFilterItem(oCustomerFilter);
        }

        this._oFilterDialog.open();
      },
      onOpenFilterDialog: function () {
        const oModel = this.getView().getModel("context");
        const aItems = oModel.getProperty("/obsoleteItems");

        // Helper to extract unique values from an array
        const getUnique = (array, field) => {
          const set = new Set(array.map(item => item[field]));
          return Array.from(set).filter(x => x !== undefined && x !== null);
        };

        // Extract unique values
        const aPlants = getUnique(aItems, "plant");
        const aCustomers = getUnique(aItems, "customer");
        // const aHandling = getUnique(aItems, "handling");

        if (!this._oFilterDialog) {
          this._oFilterDialog = new sap.m.ViewSettingsDialog({
            title: "Filter",
            confirm: this.onFilterConfirm.bind(this)
          });

          // --- PLANT FILTER ---
          const oPlantFilter = new sap.m.ViewSettingsFilterItem({
            text: "Plant",
            key: "plant"
          });

          aPlants.forEach(p => {
            oPlantFilter.addItem(new sap.m.ViewSettingsItem({ text: p, key: p }));
          });

          // --- CUSTOMER FILTER ---
          const oCustomerFilter = new sap.m.ViewSettingsFilterItem({
            text: "Customer",
            key: "customer"
          });

          aCustomers.forEach(c => {
            oCustomerFilter.addItem(new sap.m.ViewSettingsItem({ text: c, key: c }));
          });



          // Add to dialog
          this._oFilterDialog.addFilterItem(oPlantFilter);
          this._oFilterDialog.addFilterItem(oCustomerFilter);
        }

        this._oFilterDialog.open();
      },

      onFilterConfirm: function (oEvent) {
        var aSelectedFilterItems = oEvent.getParameter("filterItems");
        var aFilters = [];

        aSelectedFilterItems.forEach(function (oItem) {
          aFilters.push(
            new sap.ui.model.Filter(
              oItem.getParent().getKey(),               // e.g. plant / customer
              sap.ui.model.FilterOperator.EQ,
              oItem.getText()                           // selected value
            )
          );
        });

        var oTable = this.byId("obsoleteTable");
        var oBinding = oTable.getBinding("rows"); // ✅ rows, not items

        if (!oBinding) {
          return;
        }

        oBinding.filter(aFilters);

        // Optional but recommended
        oTable.clearSelection();
      },

      // onFilterConfirm: function (oEvent) {
      //   var aSelectedFilterItems = oEvent.getParameter("filterItems"); // 
      //   var aFilters = [];

      //   aSelectedFilterItems.forEach(function (oItem) {
      //     aFilters.push(
      //       new sap.ui.model.Filter(
      //         oItem.getParent().getKey(),                    // plant / customer
      //         sap.ui.model.FilterOperator.EQ,
      //         oItem.getText()                      // selected value
      //       )
      //     );
      //   });

      //   var oTable = this.byId("obsoleteTable");
      //   var oBinding = oTable.getBinding("items");

      //   oBinding.filter(aFilters);
      // },
      onDeleteSelected: function () {
        var oTable = this.byId("obsoleteTable");
        var oModel = this.getView().getModel("context");

        var aSelectedIndices = oTable.getSelectedIndices();

        if (!aSelectedIndices.length) {
          sap.m.MessageToast.show("Please select at least one row to delete.");
          return;
        }

        // Sort descending to avoid index shift
        aSelectedIndices.sort(function (a, b) {
          return b - a;
        });

        aSelectedIndices.forEach(function (iIndex) {
          var oContext = oTable.getContextByIndex(iIndex);
          if (oContext) {
            oModel.setProperty(oContext.getPath(), null);
          }
        });

        // Remove null entries safely
        var aItems = oModel.getProperty("/obsoleteItems") || [];
        aItems = aItems.filter(function (item) {
          return item !== null;
        });

        oModel.setProperty("/obsoleteItems", aItems);
        this.byId("obsoleteTable").clearSelection();

        // oTable.clearSelection();

        sap.m.MessageToast.show("Selected rows deleted.");
      },


      // onFilterConfirm: function (oEvent) {
      //   var aSelectedFilters = oEvent.getParameter("filterItems");
      //   var aFilters = [];

      //   aSelectedFilters.forEach(function (oItem) {
      //     aFilters.push(
      //       new sap.ui.model.Filter(
      //         oItem.getKey(),
      //         sap.ui.model.FilterOperator.EQ,
      //         oItem.getText()
      //       )
      //     );
      //   });

      //   var oTable = this.byId("obsoleteTable");
      //   oTable.getBinding("items").filter(aFilters);
      // },
      // onDeleteSelected: function () {
      //   var oTable = this.byId("obsoleteTable");
      //   var oModel = this.getView().getModel("context");

      //   // Get full list of items
      //   var aItems = oModel.getProperty("/obsoleteItems") || [];

      //   // Get selected items
      //   var aSelectedContexts = oTable.getSelectedContexts();

      //   if (aSelectedContexts.length === 0) {
      //     sap.m.MessageToast.show("Please select at least one row to delete.");
      //     return;
      //   }

      //   // Collect indices of selected rows
      //   var aIndicesToDelete = aSelectedContexts.map(ctx => {
      //     return parseInt(ctx.getPath().split("/").pop());
      //   });

      //   // Remove selected rows (sorted descending to avoid index shift)
      //   aIndicesToDelete.sort((a, b) => b - a).forEach(index => {
      //     aItems.splice(index, 1);
      //   });

      //   // Update model
      //   oModel.setProperty("/obsoleteItems", aItems);

      //   // Clear selection
      //   oTable.removeSelections();

      //   sap.m.MessageToast.show("Selected rows deleted.");
      // },
      // onUpdateComments: function () {
      //   var oTable = this.byId("obsoleteTable");
      //   var aSelectedContexts = oTable.getSelectedContexts();

      //   if (aSelectedContexts.length === 0) {
      //     sap.m.MessageToast.show("Please select at least one row.");
      //     return;
      //   }

      //   if (!this._oUpdateCommentsDialog) {
      //     this._oUpdateCommentsDialog = sap.ui.xmlfragment(
      //       "obsoletetaskform.workflowuimodule.view.fragment.UpdateCommentsDialog",
      //       this
      //     );
      //     this.getView().addDependent(this._oUpdateCommentsDialog);
      //   }

      //   // Clear previous value
      //   sap.ui.getCore().byId("bulkComments").setValue("");

      //   this._oUpdateCommentsDialog.open();
      // },
      // onApplyComments: function () {
      //   var oTable = this.byId("obsoleteTable");
      //   var oModel = this.getView().getModel("context");
      //   var sComment = sap.ui.getCore().byId("bulkComments").getValue();

      //   if (!sComment) {
      //     sap.m.MessageToast.show("Please enter a comment.");
      //     return;
      //   }

      //   var aItems = oModel.getProperty("/obsoleteItems");
      //   var aSelectedContexts = oTable.getSelectedContexts();

      //   aSelectedContexts.forEach(function (oContext) {
      //     var iIndex = oContext.getPath().split("/").pop();
      //     aItems[iIndex].comments = sComment;
      //   });

      //   oModel.setProperty("/obsoleteItems", aItems);
      //   oTable.removeSelections();

      //   this._oUpdateCommentsDialog.close();
      //   // this._oUpdateCommentsDialog.destroy();

      //   sap.m.MessageToast.show("Comments updated for selected rows.");
      // },

      onUpdateComments: function () {
        var oTable = this.byId("obsoleteTable");
        var aSelectedIndices = oTable.getSelectedIndices();

        if (!aSelectedIndices.length) {
          sap.m.MessageToast.show("Please select at least one row.");
          return;
        }

        // store selected contexts (same pattern as Handling)
        this._aSelectedContexts = [];

        aSelectedIndices.forEach(function (iIndex) {
          var oContext = oTable.getContextByIndex(iIndex);
          if (oContext) {
            this._aSelectedContexts.push(oContext);
          }
        }.bind(this));

        if (!this._oUpdateCommentsDialog) {
          this._oUpdateCommentsDialog = sap.ui.xmlfragment(
            "obsoletetaskform.workflowuimodule.view.fragment.UpdateCommentsDialog",
            this
          );
          this.getView().addDependent(this._oUpdateCommentsDialog);
        }

        sap.ui.getCore().byId("bulkComments").setValue("");
        this._oUpdateCommentsDialog.open();
      },
      onApplyComments: function () {
        var sComment = sap.ui.getCore().byId("bulkComments").getValue();

        if (!sComment) {
          sap.m.MessageToast.show("Please enter a comment.");
          return;
        }

        // ✅ update model via binding contexts
        this._aSelectedContexts.forEach(function (oContext) {
          oContext.getModel().setProperty(
            oContext.getPath() + "/comments",
            sComment
          );
        });

        this.byId("obsoleteTable").clearSelection();
        this._oUpdateCommentsDialog.close();

        sap.m.MessageToast.show("Comments updated for selected rows.");
      },

      onCloseCommentsDialog: function () {
        this._oUpdateCommentsDialog.close();
      },
      onExportObsoleteItems: function () {
        var oTable = this.byId("obsoleteTable");

        // oTable.getBinding("rows")
        var oBinding = oTable.getBinding("rows");

        if (!oBinding) {
          sap.m.MessageToast.show("No data to export");
          return;
        }

        // Get ONLY filtered/visible data
        var aContexts = oBinding.getContexts(0, oBinding.getLength());
        var aData = aContexts.map(oCtx => oCtx.getObject());

        if (aData.length === 0) {
          sap.m.MessageToast.show("No records to export");
          return;
        }

        var aColumns = this._createExportColumns();

        var oSettings = {
          workbook: {
            columns: aColumns
          },
          dataSource: aData,
          fileName: "Obsolete_Items.xlsx"
        };

        var oSpreadsheet = new Spreadsheet(oSettings);
        oSpreadsheet.build()
          .finally(function () {
            oSpreadsheet.destroy();
          });
      },
      _createExportColumns: function () {
        return [
          { label: "RFQ ID", property: "rfqId", type: "string" },
          { label: "Plant", property: "plant", type: "string" },
          { label: "Component", property: "component", type: "string" },
          { label: "Description", property: "description", type: "string" },
          { label: "Manufacture Part", property: "manufacturePart", type: "string" },

          { label: "Available Stock", property: "availableStock", type: "number" },
          { label: "Available Cu", property: "availableCu", type: "number" },
          { label: "Last Consumption", property: "lastConsumption", type: "string" },
          { label: "Coverage", property: "coverage", type: "number" },
          { label: "PN", property: "pn", type: "string" },

          { label: "Customer", property: "customer", type: "string" },
          { label: "End Customer", property: "endCustomer", type: "string" },
          { label: "Reason", property: "reason", type: "string" },
          { label: "Caused", property: "caused", type: "string" },

          { label: "Handling", property: "handling", type: "string" },
          { label: "Comments", property: "comments", type: "string" }
        ];
      },

      onSave: function () {
        this.completeTask(true);
      },
      completeTask: function (approvalStatus, outcomeId) {
        // this.getModel("context").setProperty("/approved", approvalStatus);
        // if (!this._validateRequiredFields()) {
        //   return;
        // }
        this._patchTaskInstance();
      },
      _patchTaskInstance: function (outcomeId) {
        const context = this.getView().getModel("context").getData();
        // var data = {
        //   status: "COMPLETED",
        //   context: { ...context, comment: context.comment || '' },
        //   decision: outcomeId
        // };
        let data = context;
        jQuery.ajax({
          url: `${this._getTaskInstancesBaseURL()}`,
          method: "PATCH",
          contentType: "application/json",
          async: true,
          data: JSON.stringify(data),
          headers: {
            "X-CSRF-Token": this._fetchToken(),
          },
        }).done(() => {
          sap.m.MessageToast.show("Saved");
        })
      },
      _getTaskInstancesBaseURL: function () {
        return (
          this._getWorkflowRuntimeBaseURL() +
          "/task-instances/" +
          this.getTaskInstanceID() + "/context"
        );
      },

      getTaskInstanceID: function () {
        return this.getView().getModel("task").getData().InstanceID;
      },

      _getWorkflowRuntimeBaseURL: function () {
        var ui5CloudService = this.getOwnerComponent().getManifestEntry("/sap.cloud/service").replaceAll(".", "");
        var ui5ApplicationName = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".", "");
        var appPath = `${ui5CloudService}.${ui5ApplicationName}`;
        return `/${appPath}/api/public/workflow/rest/v1`

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


    });
  }
);
