/*global
 YAHOO
 */
(function(){

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    /**
     * @module toronto.widget
     * @class Tabset
     * @param {int} currentTabIndex The initial active tab
     */
    Toronto.widget.core.v2_5_0.Tabset = function(currentTabIndex){
        this._currentTabIndex = parseInt(currentTabIndex, 10);

        /**
         * Event fired when the active tab of the widget changes
         * @event onActiveTabChanged
         */
        this.onActiveTabChanged = new Toronto.client.Event("Tabset onClick");
    };

    YAHOO.lang.extend(Toronto.widget.core.v2_5_0.Tabset, Toronto.framework.DefaultWidgetImpl, {

        /**
         * Retrieve the tab with the given index
         *
         * @param {int} index The index of the tab to be returned
         */
        getTab: function(index){
            return this._tabs[index];
        },

        /**
         * Set the active tab
         *
         * @param {int} index The index of the tab to be made active
         */
        setCurrentTab: function(index) {
            this._setCurrentTab(parseInt(index, 10)); // Cast it as an int so it works if called from call-widget-method

            if (this._isBound && this._dsChangeHandler !== null) {
                this._dsChangeHandler.disable();
                this._ds.setCurrentRowField(this._activeTabField[1], this._currentTabIndex);
                this._dsChangeHandler.enable();
            }

        },

        _setCurrentTab: function(index) {
            if (index < 0 || index >= this._tabs.length) {
                return;
            }
            var tab = this.getTab(index);
            if (tab === this.getCurrentTab()) {
                return;
            }
            if (!tab.getEnabled() || !tab.getVisible()) {
                return;
            }

            else {
                var oldTab = this.getCurrentTab();
                oldTab.hide(false);
                this._setCurrentTabIndex(index);
                var newTab = this.getCurrentTab();
                newTab.show();
                this.onActiveTabChanged.fireEvent({
                    oldSelectedTab: oldTab,
                    newSelectedTab: newTab,
                    widget: this
                });
            }
        },

        /**
         * Retrieve the active tab
         */
        getCurrentTab: function() {
            return this.getTab(this.getCurrentTabIndex());
        },

        /**
         * Retrieve the active tab's index
         */
        getCurrentTabIndex: function() {
            return this._currentTabIndex;
        },

        _setCurrentTabIndex: function(index) {
            this._currentTabIndex = index;
        },

        /**
         * Implements Widget.startup.
         *
         * Retrieves references to this widget's DOM elements and attached DOM events.
         *
         * @method startup
         * @param {WidgetContext} widgetContext
         */
        startup: function(widgetContext) {
            Toronto.widget.core.v2_5_0.Tabset.superclass.startup.apply(this, arguments);

            if (isNaN(this._currentTabIndex)) {
                throw new Error("Tabset: current tab index '" + this._currentTabIndex + "' is not valid");
            }

            this._tabs = (function(){
                var tabs = [];
                var children = widgetContext.getWidgetNode().getChildNodes();
                for (var i = 0; i < children.length; i += 1) {
                    tabs.push(children[i]);
                }
                return tabs;
            })();

            if (this._currentTabIndex >= this._tabs.length) {
                throw new Error("Tabset: current tab index '" + this._currentTabIndex + "' is outside range of tabs");
            }

            var field = this.getAttribute('active-tab-field');

            if (YAHOO.lang.isUndefined(field)) {
                this._isBound = false;
            }
            else {
                this._activeTabField = field.split('.');
                this._isBound = true;
            }
        },

        /**
         * Implements Widget.bind
         *
         * @param {DataContext} dataContext The data context to bind to.
         */
        bind: function(dataContext) {
            Toronto.widget.core.v2_5_0.Tabset.superclass.bind.apply(this, arguments);

            if (this._ds !== null) {
                this._dsChangeHandler = null;
                this._ds = null;
            }

            if (this._isBound) {
                this._ds = dataContext.findDataset(this._activeTabField[0]);
                this._dsChangeHandler = this._ds.bindOnCurrentRowFieldChangedHandler(this._activeTabField[1], this.refresh, this);
                this._ds.onCurrentRowChanged.bindHandler(this.refresh, this);
            }
        },

        refresh: function() {
            if(parseBoolean(this.getAttribute('activate-all-tabs'))){
                // activate all tabs on refresh -> all tabs are active at all times
                this._tabs.doLoop(function(tab) {
                    tab.activate();
                });
            }

            if (!this._isBound) {
                return;
            }

            if (this._ds.getCurrentRow() === null) {
                this.setCurrentTab(0);
            }
            else {
                var tabIndex = this._ds.getCurrentRowField(this._activeTabField[1]);
                if (tabIndex === null) {
                    tabIndex = 0;
                }
                if (isNaN(tabIndex)) {
                    throw new Error("Tabset: active tab field value '" + tabIndex + "' is not valid");
                }

                this._setCurrentTab(parseInt(tabIndex, 10));
            }
        }

    });

})();
