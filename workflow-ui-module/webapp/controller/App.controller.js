sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
  ],
  function (BaseController, Spreadsheet, exportLibrary, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return BaseController.extend("obsoletetaskform.workflowuimodule.controller.App", {
      // onInit() {
      // },

      onInit: function () {
        // this._getCurrentUser();
        setTimeout(() => {
          const oContextModel = this.getOwnerComponent().getModel("context");

          oContextModel.setProperty("/deletedItems", []);

          if (oContextModel.getData() && Object.keys(oContextModel.getData()).length > 0) {
            // Context already loaded
            const ctx = oContextModel.getData();
            this._loadFilteredCAPData(ctx.workflowId, ctx.workflowName, ctx.caused);
          }

          oContextModel.attachRequestCompleted(() => {
            const ctx = oContextModel.getData();
            this._loadFilteredCAPData(ctx.workflowId, ctx.workflowName, ctx.caused);
          });

        }, 0);

        // this._loadFilteredCAPData("VJHBDJVBD", "Plant")
      },
      _getCurrentUser: function () {
        const oContextModel = this.getOwnerComponent().getModel("context");

        jQuery.ajax({
          url: "/user-api/currentUser",
          method: "GET",
          success: function (oUserData) {
            // Store in a JSON model
            var oUserModel = new sap.ui.model.json.JSONModel(oUserData);
            this.getView().setModel(oUserModel, "user");
            oContextModel.setProperty("/User", oUserData)
          }.bind(this),
          error: function (oError) {
            console.error("Error fetching user:", oError);
          }
        });
      },


      _loadFilteredCAPData: function (workflowId, sWorkflowName, sCaused) {
        const oModel = this.getView().getModel("obsolete");
        const oContextModel = this.getOwnerComponent().getModel("context");

        //SET all property to default false

        this._setDefaultFalse(oContextModel);
        let oView = this.getView();
        oView.setBusy(true);
        let aFilters = [
          new sap.ui.model.Filter("workflowId", sap.ui.model.FilterOperator.EQ, workflowId)

        ];
        aFilters.push(new sap.ui.model.Filter("isActive", sap.ui.model.FilterOperator.EQ, true))
        if (sWorkflowName === 'Plant'
        ) {
          oContextModel.setProperty("/handlingVisible", true);
          oContextModel.setProperty("/handlingEditable", true);
          oContextModel.setProperty("/handlingRequired", true);
          aFilters.push(new sap.ui.model.Filter("caused", sap.ui.model.FilterOperator.EQ, "Plant"))
        } else if (sWorkflowName === 'Customer') {
          oContextModel.setProperty("/componentVisible", true);
          oContextModel.setProperty("/decisionFlowVisible", false);
          aFilters.push(new sap.ui.model.Filter("caused", sap.ui.model.FilterOperator.EQ, "Customer"))
        } else if (sWorkflowName === 'Scrap') {
          oContextModel.setProperty("/scrapVisible", true);
          oContextModel.setProperty("/scrapEditable", true);
          oContextModel.setProperty("/scrapRequired", true);
          aFilters.push(new sap.ui.model.Filter("handling", sap.ui.model.FilterOperator.EQ, "Scrapping"))
        } else if (sWorkflowName === 'AlternativeUsage') {
          oContextModel.setProperty("/alternativeVisible", true);
          aFilters.push(new sap.ui.model.Filter("handling", sap.ui.model.FilterOperator.EQ, "Alternative use"))
        } else if (sWorkflowName === 'Subsidiary') {
          oContextModel.setProperty("/subsidiaryVisible", true);
          aFilters.push(new sap.ui.model.Filter("handling", sap.ui.model.FilterOperator.EQ, "Alternative use"))
          aFilters.push(new sap.ui.model.Filter("internalUse", sap.ui.model.FilterOperator.EQ, false))
        }
        else if (sWorkflowName === 'ScrapSubsidiary') {
          oContextModel.setProperty("/scrapVisible", true);
          oContextModel.setProperty("/scrapEditable", true);
          oContextModel.setProperty("/scrapRequired", true);
          aFilters.push(new sap.ui.model.Filter("handling", sap.ui.model.FilterOperator.EQ, "Alternative use"))
          aFilters.push(new sap.ui.model.Filter("internalUse", sap.ui.model.FilterOperator.EQ, false))
          aFilters.push(new sap.ui.model.Filter("sellToSubsidiary", sap.ui.model.FilterOperator.EQ, false))
        } else if (sWorkflowName === 'HandlingCaused') {
          oContextModel.setProperty("/handlingVisible", true);
          oContextModel.setProperty("/handlingEditable", true);
          oContextModel.setProperty("/handlingRequired", true);
        }

        if (sCaused === "PlantCaused") {
          aFilters.push(new sap.ui.model.Filter("caused", sap.ui.model.FilterOperator.EQ, "Plant"))
        } else if (sCaused === "CustomerCaused") {
          aFilters.push(new sap.ui.model.Filter("caused", sap.ui.model.FilterOperator.EQ, "Customer"))
          aFilters.push(new sap.ui.model.Filter("decisionFlow", sap.ui.model.FilterOperator.EQ, "Customer doesn't pay"))
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
            oContextModel.setProperty("/deletedItems", []);
            oView.setBusy(false);
          },
          error: (oError) => {
            console.error("OData error:", oError);
            oView.setBusy(false);
          }
        });
      },

      _setDefaultFalse: function (oContextModel) {
        oContextModel.setProperty("/handlingVisible", false);
        oContextModel.setProperty("/handlingEditable", false);
        oContextModel.setProperty("/handlingRequired", false);

        oContextModel.setProperty("/scrapVisible", false);
        oContextModel.setProperty("/scrapEditable", false);
        oContextModel.setProperty("/scrapRequired", false);

        oContextModel.setProperty("/alternativeVisible", false);

        oContextModel.setProperty("/subsidiaryVisible", false);

        oContextModel.setProperty("/componentVisible", false);

        oContextModel.setProperty("/decisionFlowVisible", true);



        //For oldcomments visibility
        oContextModel.setProperty("/scrapcmt", true);
        oContextModel.setProperty("/alternativecmt", true);
        oContextModel.setProperty("/subsidiarycmt", true);
        oContextModel.setProperty("/componentcmt", true);
        oContextModel.setProperty("/handlingcmt", true);
      },



      // onSearch: function (oEvent) {
      //   var sValue = oEvent.getParameter("newValue");
      //   var oTable = this.byId("obsoleteTable");
      //   var oBinding = oTable.getBinding("rows"); //  rows, not items

      //   if (!oBinding) {
      //     return;
      //   }

      //   var aFilters = [];

      //   if (sValue) {
      //     aFilters.push(
      //       new sap.ui.model.Filter({
      //         filters: [
      //           new sap.ui.model.Filter("rfqId", sap.ui.model.FilterOperator.Contains, sValue),
      //           new sap.ui.model.Filter("plant", sap.ui.model.FilterOperator.Contains, sValue),
      //           new sap.ui.model.Filter("component", sap.ui.model.FilterOperator.Contains, sValue),

      //           new sap.ui.model.Filter("description", sap.ui.model.FilterOperator.Contains, sValue),
      //           new sap.ui.model.Filter("manufacturerPart", sap.ui.model.FilterOperator.Contains, sValue),
      //           new sap.ui.model.Filter("availableStock", sap.ui.model.FilterOperator.Contains, sValue),
      //           new sap.ui.model.Filter("availableCu", sap.ui.model.FilterOperator.Contains, sValue),
      //           new sap.ui.model.Filter("rangeCoverage", sap.ui.model.FilterOperator.Contains, sValue),
      //           new sap.ui.model.Filter("pn", sap.ui.model.FilterOperator.Contains, sValue),
      //           new sap.ui.model.Filter("customer", sap.ui.model.FilterOperator.Contains, sValue),
      //           new sap.ui.model.Filter("endCustomer", sap.ui.model.FilterOperator.Contains, sValue),
      //           new sap.ui.model.Filter("reason", sap.ui.model.FilterOperator.Contains, sValue),
      //           new sap.ui.model.Filter("caused", sap.ui.model.FilterOperator.Contains, sValue),
      //           new sap.ui.model.Filter("totalAmount", sap.ui.model.FilterOperator.Contains, sValue),
      //           new sap.ui.model.Filter("weight", sap.ui.model.FilterOperator.Contains, sValue)

      //         ],
      //         and: false // OR condition
      //       })
      //     );
      //   }

      //   oBinding.filter(aFilters);
      // },

      onSearch: function (oEvent) {
        const sValue = (oEvent.getParameter("newValue") || "").toLowerCase();
        const oTable = this.byId("obsoleteTable");
        const oBinding = oTable.getBinding("rows");

        if (!oBinding) {
          return;
        }

        // Clear global search
        if (!sValue) {
          oBinding.filter([], sap.ui.model.FilterType.Application);
          return;
        }

        const aSearchFields = [
          "rfqId",
          "plant",
          "component",
          "description",
          "manufacturerPart",
          "availableStock",
          "availableCu",
          "rangeCoverage",
          "pn",
          "customer",
          "endCustomer",
          "reason",
          "caused",
          "totalAmount",
          "weight",
          "decisionFlow"
        ];

        const aFilters = aSearchFields.map(function (sField) {
          return new sap.ui.model.Filter(sField, function (vValue) {
            return vValue !== null &&
              vValue !== undefined &&
              vValue.toString().toLowerCase().includes(sValue);
          });
        });

        const oGlobalFilter = new sap.ui.model.Filter({
          filters: aFilters,
          and: false // OR condition
        });

        oBinding.filter(oGlobalFilter, sap.ui.model.FilterType.Application);
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
      onClearAllFilters: function () {
        const oTable = this.byId("obsoleteTable");
        const oBinding = oTable.getBinding("rows");

        if (!oBinding) {
          return;
        }

        // 1️⃣ Clear all filters (both types)
        oBinding.filter([]);

        // 2️⃣ Clear sorting
        oBinding.sort([]);

        // 3️⃣ Reset column states
        oTable.getColumns().forEach(function (oColumn) {
          oColumn.setFiltered(false);
          oColumn.setFilterValue("");
          oColumn.setSorted(false);
          oColumn.setSortOrder(sap.ui.table.SortOrder.None);
        });

        // 4️⃣ Clear SearchField
        const oSearchField = this.byId("searchField");
        if (oSearchField) {
          oSearchField.setValue("");
        }

        // 5️⃣ Force refresh
        oBinding.refresh();
      },
      onSortConfirm: function (oEvent) {
        var sKey = oEvent.getParameter("sortItem").getKey();
        var bDesc = oEvent.getParameter("sortDescending");

        var oTable = this.byId("obsoleteTable");
        var oBinding = oTable.getBinding("rows"); //  rows, not items

        if (!oBinding) {
          return;
        }

        var oSorter = new sap.ui.model.Sorter(sKey, bDesc);
        oBinding.sort(oSorter);

        // Optional: clear selection after sort
        oTable.clearSelection();
      },


      // onUpdateHandling: function () {
      //   var oTable = this.byId("obsoleteTable");
      //   var aSelectedIndices = oTable.getSelectedIndices();

      //   if (!aSelectedIndices.length) {
      //     sap.m.MessageToast.show("Please select at least one row");
      //     return;
      //   }

      //   this._aSelectedContexts = [];

      //   aSelectedIndices.forEach(function (iIndex) {
      //     var oContext = oTable.getContextByIndex(iIndex);
      //     if (oContext) {
      //       this._aSelectedContexts.push(oContext);
      //     }
      //   }.bind(this));

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
        const oTable = this.byId("obsoleteTable");
        const aSelectedIndices = oTable.getSelectedIndices();

        if (!aSelectedIndices.length) {
          sap.m.MessageToast.show("Please select at least one row");
          return;
        }

        this._aSelectedContexts = [];

        aSelectedIndices.forEach((iIndex) => {
          const oContext = oTable.getContextByIndex(iIndex);
          if (oContext) {
            this._aSelectedContexts.push(oContext);
          }
        });

        // Create dialog if not already created
        if (!this._oHandlingDialog) {
          this._oHandlingDialog = sap.ui.xmlfragment(
            "obsoletetaskform.workflowuimodule.view.fragment.HandlingUpdate",
            this
          );
          this.getView().addDependent(this._oHandlingDialog);
        }

        // Create/reset dialog model
        const oDialogModel = new sap.ui.model.json.JSONModel({
          handling: "",
          commentHandling: ""
        });

        this._oHandlingDialog.setModel(oDialogModel, "handling");

        this._oHandlingDialog.open();
      },

      onCancelHandlingDialog: function () {
        this._oHandlingDialog.close();
      },


      onApplyHandlingUpdate: function () {
        var oDialogModel = this._oHandlingDialog.getModel("handling");

        const sSelectedHandling = oDialogModel.getProperty("/handling");
        const sComment = oDialogModel.getProperty("/commentHandling");

        if (!sSelectedHandling) {
          sap.m.MessageToast.show("Please select Handling value");
          return;
        }

        this._aSelectedContexts.forEach((oContext) => {
          oContext.getModel().setProperty(
            oContext.getPath() + "/handling",
            sSelectedHandling
          );

          oContext.getModel().setProperty(
            oContext.getPath() + "/commentHandling",
            sComment
          );
        });

        this.byId("obsoleteTable").clearSelection();
        this._oHandlingDialog.close();
        sap.m.MessageToast.show("Handling updated successfully");
      },



      //For updating the Scrapping

      // onUpdateScrap: function () {
      //   var oTable = this.byId("obsoleteTable");
      //   var aSelectedIndices = oTable.getSelectedIndices();

      //   if (!aSelectedIndices.length) {
      //     sap.m.MessageToast.show("Please select at least one row");
      //     return;
      //   }

      //   this._aSelectedContexts = [];

      //   aSelectedIndices.forEach(function (iIndex) {
      //     var oContext = oTable.getContextByIndex(iIndex);
      //     if (oContext) {
      //       this._aSelectedContexts.push(oContext);
      //     }
      //   }.bind(this));

      //   if (!this._oScrapDialog) {
      //     this._oScrapDialog = sap.ui.xmlfragment(
      //       "obsoletetaskform.workflowuimodule.view.fragment.ScrapUpdate",
      //       this
      //     );
      //     this.getView().addDependent(this._oScrapDialog);
      //   }

      //   sap.ui.getCore().byId("massHandlingSelectScrap").setSelectedKey("");
      //   this._oScrapDialog.open();
      // },

      onUpdateScrap: function () {
        const oTable = this.byId("obsoleteTable");
        const aSelectedIndices = oTable.getSelectedIndices();

        if (!aSelectedIndices.length) {
          sap.m.MessageToast.show("Please select at least one row");
          return;
        }

        this._aSelectedContexts = [];

        aSelectedIndices.forEach((iIndex) => {
          const oContext = oTable.getContextByIndex(iIndex);
          if (oContext) {
            this._aSelectedContexts.push(oContext);
          }
        });

        if (!this._oScrapDialog) {
          this._oScrapDialog = sap.ui.xmlfragment(
            "obsoletetaskform.workflowuimodule.view.fragment.ScrapUpdate",
            this
          );
          this.getView().addDependent(this._oScrapDialog);
        }

        // Create/reset dialog model
        const oDialogModel = new sap.ui.model.json.JSONModel({
          scrapDecision: "",
          commentScrap: ""
        });

        this._oScrapDialog.setModel(oDialogModel, "scrap");
        this._oScrapDialog.open();
      },
      onCancelScrapDialog: function () {
        this._oScrapDialog.close();
      },


      // onApplyScrapUpdate: function () {

      //   // const sCurrentUser = this.getView().getModel('user').getData().email;
      //   var sSelectedHandling = sap.ui.getCore()
      //     .byId("massHandlingSelectScrap")
      //     .getSelectedKey();

      //   if (!sSelectedHandling) {
      //     sap.m.MessageToast.show("Please select Scrapping value");
      //     return;
      //   }

      //   //  Loop over selected binding contexts
      //   this._aSelectedContexts.forEach((oContext) => {
      //     oContext.getModel().setProperty(
      //       oContext.getPath() + "/scrapDecision",
      //       sSelectedHandling
      //     );

      //   });
      //   this.byId("obsoleteTable").clearSelection();
      //   this._oScrapDialog.close();
      //   sap.m.MessageToast.show("Scrapping updated successfully");
      // },


      // onUpdateCustomer: function () {
      //   var oTable = this.byId("obsoleteTable");
      //   var aSelectedIndices = oTable.getSelectedIndices();

      //   if (!aSelectedIndices.length) {
      //     sap.m.MessageToast.show("Please select at least one row");
      //     return;
      //   }

      //   this._aSelectedContextsCustomer = [];

      //   aSelectedIndices.forEach(function (iIndex) {
      //     var oContext = oTable.getContextByIndex(iIndex);
      //     if (oContext) {
      //       this._aSelectedContextsCustomer.push(oContext);
      //     }
      //   }.bind(this));

      //   if (!this._oCustomerDialog) {
      //     this._oCustomerDialog = sap.ui.xmlfragment(
      //       "obsoletetaskform.workflowuimodule.view.fragment.CustomerUpdate",
      //       this
      //     );
      //     this.getView().addDependent(this._oCustomerDialog);
      //   }

      //   sap.ui.getCore().byId("massCustomerSelect").setSelectedKey("");
      //   this._oCustomerDialog.open();
      // },

      onApplyScrapUpdate: function () {
        const oDialogModel = this._oScrapDialog.getModel("scrap");
        const sSelectedScrap = oDialogModel.getProperty("/scrapDecision");
        const sComment = oDialogModel.getProperty("/commentScrap");

        if (!sSelectedScrap) {
          sap.m.MessageToast.show("Please select Scrapping value");
          return;
        }

        this._aSelectedContexts.forEach((oContext) => {
          oContext.getModel().setProperty(
            oContext.getPath() + "/scrapDecision",
            sSelectedScrap
          );

          oContext.getModel().setProperty(
            oContext.getPath() + "/commentScrap",
            sComment
          );
        });

        this.byId("obsoleteTable").clearSelection();
        this._oScrapDialog.close();
        sap.m.MessageToast.show("Scrapping updated successfully");
      },
      onUpdateCustomer: function () {
        const oTable = this.byId("obsoleteTable");
        const aSelectedIndices = oTable.getSelectedIndices();

        if (!aSelectedIndices.length) {
          sap.m.MessageToast.show("Please select at least one row");
          return;
        }

        this._aSelectedContextsCustomer = [];

        aSelectedIndices.forEach((iIndex) => {
          const oContext = oTable.getContextByIndex(iIndex);
          if (oContext) {
            this._aSelectedContextsCustomer.push(oContext);
          }
        });

        if (!this._oCustomerDialog) {
          this._oCustomerDialog = sap.ui.xmlfragment(
            "obsoletetaskform.workflowuimodule.view.fragment.CustomerUpdate",
            this
          );
          this.getView().addDependent(this._oCustomerDialog);
        }

        // Dialog model with comment field
        const oDialogModel = new sap.ui.model.json.JSONModel({
          customerResponse: "",
          commentCustomer: ""
        });

        this._oCustomerDialog.setModel(oDialogModel, "customer");
        this._oCustomerDialog.open();
      },
      onCancelCustomerDialog: function () {
        this._oCustomerDialog.close();
      },

      // onApplyCustomerUpdate: function () {

      //   // const sCurrentUser = this.getView().getModel('user').getData().email;
      //   var sSelectedCustomer = sap.ui.getCore()
      //     .byId("massCustomerSelect")
      //     .getSelectedKey();

      //   if (!sSelectedCustomer) {
      //     sap.m.MessageToast.show("Please select Customer response value");
      //     return;
      //   }

      //   // ✅ Loop over selected binding contexts
      //   this._aSelectedContextsCustomer.forEach((oContext) => {
      //     oContext.getModel().setProperty(
      //       oContext.getPath() + "/customerResponse",
      //       sSelectedCustomer
      //     );
      //     oContext.getModel().setProperty(
      //       oContext.getPath() + `/commentComponent`,
      //       sCurrentUser
      //     );
      //   });
      //   this.byId("obsoleteTable").clearSelection();
      //   this._oCustomerDialog.close();
      //   sap.m.MessageToast.show("Customer response updated successfully");
      // },

      onApplyCustomerUpdate: function () {
        const oDialogModel = this._oCustomerDialog.getModel("customer");
        const sCustomerResponse = oDialogModel.getProperty("/customerResponse");
        const sComment = oDialogModel.getProperty("/commentCustomer");

        if (!sCustomerResponse) {
          sap.m.MessageToast.show("Please select Customer Response");
          return;
        }

        this._aSelectedContextsCustomer.forEach((oContext) => {
          oContext.getModel().setProperty(
            oContext.getPath() + "/customerResponse",
            sCustomerResponse
          );

          oContext.getModel().setProperty(
            oContext.getPath() + "/commentComponent",
            sComment
          );
        });

        this.byId("obsoleteTable").clearSelection();
        this._oCustomerDialog.close();
        sap.m.MessageToast.show("Customer response updated successfully");
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




      // onDeleteSelected: function () {

      //   const oTable = this.byId("obsoleteTable");
      //   const oContextModel = this.getView().getModel("context");

      //   const aSelectedIndices = oTable.getSelectedIndices();

      //   if (!aSelectedIndices.length) {
      //     sap.m.MessageToast.show("Please select at least one row to delete.");
      //     return;
      //   }

      //   let aItems = oContextModel.getProperty("/obsoleteItems") || [];
      //   let aDeletedItems = oContextModel.getProperty("/deletedItems") || [];

      //   // Sort DESC to avoid index shift
      //   aSelectedIndices.sort((a, b) => b - a);

      //   aSelectedIndices.forEach(iIndex => {
      //     const oRowContext = oTable.getContextByIndex(iIndex);
      //     if (!oRowContext) return;

      //     const oItem = oRowContext.getObject();

      //     // 🔴 Soft delete
      //     oItem.isActive = false;

      //     // 🔴 Track deleted item
      //     aDeletedItems.push(oItem);

      //     // 🔴 Remove from visible list
      //     aItems.splice(iIndex, 1);
      //   });

      //   // Update model
      //   oContextModel.setProperty("/obsoleteItems", aItems);
      //   oContextModel.setProperty("/deletedItems", aDeletedItems);

      //   oTable.clearSelection();
      //   sap.m.MessageToast.show("Selected rows deleted.");
      // },


      onDeleteSelected: function () {
        const oTable = this.byId("obsoleteTable");
        const oContextModel = this.getView().getModel("context");

        const aSelectedIndices = oTable.getSelectedIndices();

        if (!aSelectedIndices.length) {
          sap.m.MessageToast.show("Please select at least one row to delete.");
          return;
        }

        const iCount = aSelectedIndices.length;

        sap.m.MessageBox.confirm(
          `Are you sure you want to delete ${iCount} selected item(s)?`,
          {
            icon: sap.m.MessageBox.Icon.WARNING,
            title: "Confirm Deletion",
            actions: [
              sap.m.MessageBox.Action.OK,
              sap.m.MessageBox.Action.CANCEL
            ],
            emphasizedAction: sap.m.MessageBox.Action.OK,
            onClose: function (sAction) {
              if (sAction !== sap.m.MessageBox.Action.OK) {
                return;
              }

              //  DELETE LOGIC STARTS HERE
              let aItems = oContextModel.getProperty("/obsoleteItems") || [];
              let aDeletedItems = oContextModel.getProperty("/deletedItems") || [];

              // Sort DESC to avoid index shift
              aSelectedIndices.sort((a, b) => b - a);

              aSelectedIndices.forEach(iIndex => {
                const oRowContext = oTable.getContextByIndex(iIndex);
                if (!oRowContext) return;

                const oItem = oRowContext.getObject();

                //  Soft delete
                oItem.isActive = false;

                //  Track deleted item
                aDeletedItems.push(oItem);

                //  Remove from visible list
                aItems.splice(iIndex, 1);
              });

              // Update model
              oContextModel.setProperty("/obsoleteItems", aItems);
              oContextModel.setProperty("/deletedItems", aDeletedItems);

              oTable.clearSelection();
              sap.m.MessageToast.show("Selected rows deleted.");
              // 🔼 DELETE LOGIC ENDS HERE
            }
          }
        );
      },

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

        const oContextModel = this.getOwnerComponent().getModel("context").getData();
        const sWorkflowName = oContextModel.workflowName;
        let sDynamicComment = "";

        if (sWorkflowName === 'Plant') {
          sDynamicComment = "commentHandling"
        } else if (sWorkflowName === 'Customer') {
          sDynamicComment = "commentComponent"
        } else if (sWorkflowName === 'Scrap') {
          sDynamicComment = "commentScrap"
        } else if (sWorkflowName === 'AlternativeUsage') {
          sDynamicComment = "commentAlternative"
        } else if (sWorkflowName === 'Subsidiary') {
          sDynamicComment = "commentSubsidiary"
        }

        // const sCurrentUser = this.getView().getModel('user').getData().email;

        var sComment = sap.ui.getCore().byId("bulkComments").getValue();

        if (!sComment) {
          sap.m.MessageToast.show("Please enter a comment.");
          return;
        }

        //  update model via binding contexts
        this._aSelectedContexts.forEach((oContext) => {
          oContext.getModel().setProperty(
            oContext.getPath() + `/${sDynamicComment}`,
            sComment
          );
          // oContext.getModel().setProperty(
          //   oContext.getPath() + `/modifiedBy`,
          //   sCurrentUser
          // );
        });

        this.byId("obsoleteTable").clearSelection();
        this._oUpdateCommentsDialog.close();

        sap.m.MessageToast.show("Comments updated for selected rows.");
      },

      onChangeDropdown1: function (oEvent) {

        // 1️⃣ Get current user email
        const sCurrentUser = this.getView()
          .getModel("user")
          .getData()
          .email;

        // 2️⃣ Get row binding context
        const oCtx = oEvent.getSource().getBindingContext("context");
        if (!oCtx) {
          return;
        }

        // 3️⃣ Update ONLY modifiedBy
        const sPath = oCtx.getPath() + "/modifiedBy";
        oCtx.getModel().setProperty(sPath, sCurrentUser);

      },

      onChangeComment1: function (oEvent) {

        // 1. Get the current user
        const sCurrentUser = this.getView().getModel("user").getData().email;

        // 2. Get the binding context (row in the table)
        const oCtx = oEvent.getSource().getBindingContext("context");

        if (!oCtx) {
          console.error("No binding context found");
          return;
        }

        // 3. Build the path for modifiedBy field
        const sPath = oCtx.getPath() + "/modifiedBy";

        // 4. Update ONLY the modifiedBy field
        oCtx.getModel().setProperty(sPath, sCurrentUser);
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

      // onSave: async function () {


      //   //Check whether task is already submitted or not
      //   const oView = this.getView();
      //   oView.setBusy(true);
      //   try {
      //     await this._checkTaskStatus();
      //   } catch (sErrorMsg) {
      //     oView.setBusy(false);
      //     sap.m.MessageBox.warning(sErrorMsg);
      //     return;
      //   }
      //   const context = this.getOwnerComponent().getModel("context").getData();

      //   const oModel = this.getView().getModel("obsolete");

      //   const sWorkflowId = context.workflowId;
      //   const aItems = this.getView().getModel("context").getProperty("/obsoleteItems");

      //   const oPayload = {
      //     workflowId: sWorkflowId,
      //     items: aItems

      //   }

      //   const result = await new Promise((resolve, reject) => {
      //     const csrfToken = oModel.getSecurityToken();
      //     const serviceUrl = oModel.sServiceUrl;

      //     jQuery.ajax({
      //       url: `${serviceUrl}/bulkUpdateWorkflowItems`,
      //       method: "POST",
      //       contentType: "application/json",
      //       data: JSON.stringify({
      //         workflowId: sWorkflowId,
      //         items: aItems
      //       }),
      //       headers: {
      //         "X-CSRF-Token": csrfToken
      //       },
      //       success: resolve,
      //       error: reject
      //     });
      //   });


      // },

      onSave: async function () {

        const oView = this.getView();
        oView.setBusy(true);

        try {
          //Comment for testing
          await this._checkTaskStatus();

          ///

          const context = this.getOwnerComponent()
            .getModel("context")
            .getData();
          const oContextModel = this.getOwnerComponent()
            .getModel("context");


          const sWorkflowId = context.workflowId;
          const aItems = this.getView()
            .getModel("context")
            .getProperty("/obsoleteItems");

          const aActiveItems = oContextModel.getProperty("/obsoleteItems") || [];
          const aDeletedItems = oContextModel.getProperty("/deletedItems") || [];

          // 🔁 MERGE before save
          const aFinalItems = aActiveItems.concat(aDeletedItems);

          await this._callBulkUpdate(sWorkflowId, aFinalItems);

          oContextModel.setProperty("/deletedItems", []);

          sap.m.MessageBox.success("Saved successfully");

        } catch (oError) {
          sap.m.MessageBox.error(
            typeof oError === "string" ? oError : "Save failed"
          );
          console.error(oError);
        } finally {
          oView.setBusy(false);
        }
      },
      _callBulkUpdate: function (sWorkflowId, aItems) {
        const oModel = this.getView().getModel("obsolete");
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
            },
            success: resolve,
            error: reject
          });
        });
      },

      _checkTaskStatus: function () {

        // const sEmail = this.getView().getModel("user").getData().email;
        let oUserInfo = sap.ushell.Container.getService("UserInfo");
        const sEmail = oUserInfo.getEmail();
        return new Promise((resolve, reject) => {

          jQuery.ajax({
            url: this._getTaskInstancesStatusURL(),
            method: "GET",
            contentType: "application/json",
            headers: {
              "X-CSRF-Token": this._fetchToken()
            },
            success: function (oData) {

              // Example response: the JSON you shared
              const sStatus = oData.status;
              const sProcessor = oData.processor;

              if (sStatus === "READY") {
                resolve(true);
                return;
              }
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
              } else {
                reject(`Task is in invalid state: ${sStatus}`);
                return;
              }
            },
            error: function () {
              reject("Unable to check task status");
            }
          });

        });
      },
      _getTaskInstancesStatusURL: function () {
        return (
          this._getWorkflowRuntimeBaseURL() +
          "/task-instances/" +
          this.getTaskInstanceID()
        );
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

      //Addtional two more comment

      onUpdateInternal: function () {
        const oTable = this.byId("obsoleteTable");
        const aSelectedIndices = oTable.getSelectedIndices();

        if (!aSelectedIndices.length) {
          sap.m.MessageToast.show("Please select at least one row");
          return;
        }

        this._aSelectedContextsInternal = [];

        aSelectedIndices.forEach((iIndex) => {
          const oContext = oTable.getContextByIndex(iIndex);
          if (oContext) {
            this._aSelectedContextsInternal.push(oContext);
          }
        });

        if (!this._oInternalDialog) {
          this._oInternalDialog = sap.ui.xmlfragment(
            "obsoletetaskform.workflowuimodule.view.fragment.InternalUpdate",
            this
          );
          this.getView().addDependent(this._oInternalDialog);
        }

        // Dialog model with comment field
        const oDialogModel = new sap.ui.model.json.JSONModel({
          internalUse: false,
          commentAlternative: ""
        });

        this._oInternalDialog.setModel(oDialogModel, "internal");
        this._oInternalDialog.open();
      },
      onCancelInternalDialog: function () {
        this._oInternalDialog.close();
      },



      onApplyInternalUpdate: function () {
        const oDialogModel = this._oInternalDialog.getModel("internal");
        const bInternalUse = oDialogModel.getProperty("/internalUse");
        const sComment = oDialogModel.getProperty("/commentAlternative");

        this._aSelectedContextsInternal.forEach((oContext) => {
          oContext.getModel().setProperty(
            oContext.getPath() + "/internalUse",
            bInternalUse
          );

          oContext.getModel().setProperty(
            oContext.getPath() + "/commentAlternative",
            sComment
          );
        });

        this.byId("obsoleteTable").clearSelection();
        this._oInternalDialog.close();
        sap.m.MessageToast.show("Internal use updated successfully");
      },




      onUpdateSubsidiary: function () {
        const oTable = this.byId("obsoleteTable");
        const aSelectedIndices = oTable.getSelectedIndices();

        if (!aSelectedIndices.length) {
          sap.m.MessageToast.show("Please select at least one row");
          return;
        }

        this._aSelectedContextsSubsidiary = [];

        aSelectedIndices.forEach((iIndex) => {
          const oContext = oTable.getContextByIndex(iIndex);
          if (oContext) {
            this._aSelectedContextsSubsidiary.push(oContext);
          }
        });

        if (!this._oSubsidiaryDialog) {
          this._oSubsidiaryDialog = sap.ui.xmlfragment(
            "obsoletetaskform.workflowuimodule.view.fragment.SubsidiaryUpdate",
            this
          );
          this.getView().addDependent(this._oSubsidiaryDialog);
        }

        // Dialog model with comment field
        const oDialogModel = new sap.ui.model.json.JSONModel({
          subsidiary: false,
          commentSubsidiary: ""
        });

        this._oSubsidiaryDialog.setModel(oDialogModel, "subsidiary");
        this._oSubsidiaryDialog.open();
      },
      onCancelSubsidiaryDialog: function () {
        this._oSubsidiaryDialog.close();
      },



      onApplySubsidiaryUpdate: function () {
        const oDialogModel = this._oSubsidiaryDialog.getModel("subsidiary");
        const bSubsidiary = oDialogModel.getProperty("/subsidiary");
        const sComment = oDialogModel.getProperty("/commentSubsidiary");

        this._aSelectedContextsSubsidiary.forEach((oContext) => {
          oContext.getModel().setProperty(
            oContext.getPath() + "/sellToSubsidiary",
            bSubsidiary
          );

          oContext.getModel().setProperty(
            oContext.getPath() + "/commentSubsidiary",
            sComment
          );
        });

        this.byId("obsoleteTable").clearSelection();
        this._oSubsidiaryDialog.close();
        sap.m.MessageToast.show("Subsidiary updated successfully");
      },


      //Old commens
      /**
        * Event handler for "Show All Comments" button
        * Opens a dialog showing comment history for all selected rows in a table format
        */
      onShowAllComments: function () {
        const oModel = this.getView().getModel('context')
        const sWorkflowName = oModel.getData().workflowName;
        const sCaused = oModel.getData().caused
        if (sWorkflowName === 'Plant' && sCaused === 'PlantCaused') {
          MessageBox.information("No old comments")
          return;
        }
        if (sWorkflowName === 'Customer') {
          MessageBox.information("No old comments")
          return;
        }
        if (sCaused === 'PlantCaused') {
          oModel.setProperty("/componentcmt", false);
        }
        if (sWorkflowName === 'HandlingCaused' && sCaused === 'CustomerCaused') {
          oModel.setProperty("/alternativecmt", false);
          oModel.setProperty("/subsidiarycmt", false);
          oModel.setProperty("/scrapcmt", false);
          oModel.setProperty("/handlingcmt", false);

        }
        if (sWorkflowName === 'AlternativeUsage') {
          oModel.setProperty("/alternativecmt", false);
          oModel.setProperty("/subsidiarycmt", false);
          oModel.setProperty("/scrapcmt", false);

        } if (sWorkflowName === 'Scrap' || sWorkflowName==="ScrapSubsidiary") {
          oModel.setProperty("/scrapcmt", false);
        }
        if ( sWorkflowName === 'Subsidiary') {
          oModel.setProperty("/subsidiarycmt", false);
          oModel.setProperty("/scrapcmt", false);
        }
        const oTable = this.byId("obsoleteTable");
        const aSelectedIndices = oTable.getSelectedIndices();

        if (!aSelectedIndices.length) {
          sap.m.MessageToast.show("Please select at least one row");
          return;
        }

        const aComments = [];

        aSelectedIndices.forEach((iIndex) => {
          const oContext = oTable.getContextByIndex(iIndex);
          if (oContext) {
            aComments.push(oContext.getObject());
          }
        });

        if (!this._oCommentsDialog) {
          this._oCommentsDialog = sap.ui.xmlfragment(
            "obsoletetaskform.workflowuimodule.view.fragment.CommentHistoryDialog",
            this
          );
          this.getView().addDependent(this._oCommentsDialog);
        }

        const oCommentsModel = new sap.ui.model.json.JSONModel({
          items: aComments
        });

        this._oCommentsDialog.setModel(oCommentsModel, "comments");
        this._oCommentsDialog.open();
      },


      /**
       * Build stage history for a single item
       * @param {object} oItem - Item to process
       * @returns {array} - Array of stage records
       * @private
       */
      _buildStageHistory: function (oItem) {
        var aStages = [];

        // Stage 1: Handling Decision
        if (oItem.handling || oItem.commentHandling) {
          aStages.push({
            plant: oItem.plant,
            component: oItem.component,
            stage: "1. Handling Decision",
            stageState: "Information",
            action: oItem.handling || "",
            actionState: oItem.handling === "Scrapping" ? "Error" : "Success",
            comment: oItem.commentHandling || "",
            isCheckbox: false,
            checkboxValue: false,
            checkboxLabel: ""
          });
        }

        // Stage 2: Scrapping Decision
        if (oItem.scrapDecision || oItem.commentScrap) {
          aStages.push({
            plant: oItem.plant,
            component: oItem.component,
            stage: "2. Scrapping Decision",
            stageState: "Information",
            action: oItem.scrapDecision || "",
            actionState: oItem.scrapDecision === "To be scrapped" ? "Error" : "Success",
            comment: oItem.commentScrap || "",
            isCheckbox: false,
            checkboxValue: false,
            checkboxLabel: ""
          });
        }

        // Stage 3: Internal Use
        if (oItem.internalUse === true || oItem.commentAlternative) {
          aStages.push({
            plant: oItem.plant,
            component: oItem.component,
            stage: "3. Internal Use",
            stageState: "Information",
            action: "",
            actionState: "None",
            comment: oItem.commentAlternative || "",
            isCheckbox: true,
            checkboxValue: oItem.internalUse || false,
            checkboxLabel: oItem.internalUse ? "Selected" : "Not Selected"
          });
        }

        // Stage 4: Sell to Subsidiary
        if (oItem.sellToSubsidiary === true || oItem.commentSubsidiary) {
          aStages.push({
            plant: oItem.plant,
            component: oItem.component,
            stage: "4. Sell to Subsidiary",
            stageState: "Information",
            action: "",
            actionState: "None",
            comment: oItem.commentSubsidiary || "",
            isCheckbox: true,
            checkboxValue: oItem.sellToSubsidiary || false,
            checkboxLabel: oItem.sellToSubsidiary ? "Selected" : "Not Selected"
          });
        }

        // Stage 5: Customer Response
        if (oItem.customerResponse || oItem.commentComponent) {
          aStages.push({
            plant: oItem.plant,
            component: oItem.component,
            stage: "5. Customer Response",
            stageState: "Information",
            action: oItem.customerResponse || "",
            actionState: oItem.customerResponse === "Customer pays" ? "Success" : "Warning",
            comment: oItem.commentComponent || "",
            isCheckbox: false,
            checkboxValue: false,
            checkboxLabel: ""
          });
        }

        return aStages;
      },


      /**
       * Event handler for closing the comment history dialog
       */
      onCloseCommentsDialog: function () {
        if (this._oCommentsDialog) {
          this._oCommentsDialog.close();
        }
      }



    });
  }
);
