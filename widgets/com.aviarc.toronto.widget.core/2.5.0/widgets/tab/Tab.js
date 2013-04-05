/*global
 YAHOO
 parseBoolean
 */
(function(){

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    var apply = function(element, baseClass, customClasses){
        element.className = Toronto.util.CssUtils.makeClassString(baseClass, customClasses, []);
    };

    /**
     * @module toronto.widget
     * @class Tab
     * @param {int} tabIndex The index of this tab
     * @param {Object} activeTab The status of this tab (active or not)
     * @param {String} cssPrefix The prefix for CSS classes
     */
    Toronto.widget.core.v2_5_0.Tab = function(tabIndex, activeTab, cssPrefix){
        this._tabIndex = parseInt(tabIndex, 10);
        this._isFirstActive = parseBoolean(activeTab);
        this._cssPrefx = cssPrefix;

        /**
         * Event fired when this tab of the tabset changes from non-current to current
         * @event onSelected
         */
        this.onSelected = new Toronto.client.Event("Tab onSelected");

        /**
         * Event fired when this tab of the tabset changes from current to non-current
         * @event onUnselected
         */
        this.onUnselected = new Toronto.client.Event("Tab onSelected");

        /**
         * Event fired when this tab of the tabset changes from non-current to current. Is just an alias for onSelected, kept for backward compatibility.
         * @event onActivated
         */
        this.onActivated = this.onSelected;

        /**
         * Event fired when this tab of the tabset changes from current to non-current. Is just an alias for onUnselected, kept for backward compatibility.
         * @event onDeactived
         */
        this.onDeactived = this.onUnselected;

        /**
         * Event fired when this tab changes visibility (different from show/hide and the current/non-current states).
         * @event onVisibleChanged
         */
        this.onVisibleChanged = new Toronto.client.Event("Tab onVisibleChanged");

        /**
         * Event fired when this tab becomes disabled/enabled.
         * @event onEnabledChanged
         */
        this.onEnabledChanged = new Toronto.client.Event("Tab onEnabledChanged");

        this._tabStatus = {
            isCurrentTab: undefined,
            enabled: undefined,
            visible: undefined
        };
    };
    YAHOO.lang.extend(Toronto.widget.core.v2_5_0.Tab, Toronto.framework.DefaultWidgetImpl, {

        /**
         * Retrieve the index of this tab
         */
        getTabIndex: function(){
            return this._tabIndex;
        },

        /**
         * Retrieve the CSS prefix for this tab
         */
        getCssPrefix: function(){
            return this._cssPrefx;
        },

        _makeCurrentTab: function(current, customClasses){
            if (current) {
                apply(this.activeTabElement, this.getCssPrefix() + "tab-active", customClasses);
                apply(this.inactiveTabElement, this.getCssPrefix() + "tab-active", customClasses);
                apply(this.contentElement, this.getCssPrefix() + "tabset-tab-content-active", customClasses);
                if (customClasses.length > 0) {
                    customClasses.doLoop(function(c){
                        Toronto.util.CssUtils.addClass(this.tabsetBodyElement, ("tab-" + c));
                    }, this);
                }
            }
            else {
                apply(this.activeTabElement, this.getCssPrefix() + "tab-inactive", customClasses);
                apply(this.inactiveTabElement, this.getCssPrefix() + "tab-inactive", customClasses);
                apply(this.contentElement, this.getCssPrefix() + "tabset-tab-content-inactive", customClasses);
                if (customClasses.length > 0) {
                    customClasses.doLoop(function(c){
                        Toronto.util.CssUtils.removeClass(this.tabsetBodyElement, ("tab-" + c));
                    }, this);
                }
            }
        },

        _makeVisible: function(visible, customClasses){
            if (visible) {
                apply(this.activeTabElement, this.getCssPrefix() + "tab-inactive", customClasses);
                apply(this.inactiveTabElement, this.getCssPrefix() + "tab-inactive", customClasses);
                apply(this.contentElement, this.getCssPrefix() + "tabset-tab-content-inactive", customClasses);
            }
            else {
                apply(this.activeTabElement, this.getCssPrefix() + "tab-hidden", customClasses);
                apply(this.inactiveTabElement, this.getCssPrefix() + "tab-hidden", customClasses);
                apply(this.contentElement, this.getCssPrefix() + "tabset-tab-content-hidden", customClasses);
            }
        },

        _makeEnabled: function(enabled, customClasses){
            if (enabled) {
                apply(this.activeTabElement, this.getCssPrefix() + "tab-inactive", customClasses);
                apply(this.inactiveTabElement, this.getCssPrefix() + "tab-inactive", customClasses);
                apply(this.contentElement, this.getCssPrefix() + "tabset-tab-content-inactive", customClasses);
            }
            else {
                apply(this.activeTabElement, this.getCssPrefix() + "tab-disabled", customClasses);
                apply(this.inactiveTabElement, this.getCssPrefix() + "tab-disabled", customClasses);
                apply(this.contentElement, this.getCssPrefix() + "tabset-tab-content-disabled", customClasses);
            }
        },

        _applyStatus: function(newStatus){
            if (YAHOO.lang.isUndefined(newStatus.isCurrentTab) && YAHOO.lang.isUndefined(newStatus.enabled) && YAHOO.lang.isUndefined(newStatus.visible)) {
                return;
            }

            var customClasses = this.getAttribute('class');
            customClasses = YAHOO.lang.isUndefined(customClasses) ? [] : customClasses.trim().split(/ +/);

            var oldStatus = this._tabStatus;

            if (!YAHOO.lang.isUndefined(newStatus.isCurrentTab)) {
                if (oldStatus.isCurrentTab === false && newStatus.isCurrentTab === true) {
                    this._makeCurrentTab(true, customClasses);
                    this.onSelected.fireEvent();
                    this._tabStatus.isCurrentTab = newStatus.isCurrentTab;
                }
                else
                    if (oldStatus.isCurrentTab === true && newStatus.isCurrentTab === false) {
                        this._makeCurrentTab(false, customClasses);
                        this.onUnselected.fireEvent();
                        this._tabStatus.isCurrentTab = newStatus.isCurrentTab;
                    }
            }

            if (!YAHOO.lang.isUndefined(newStatus.visible)) {
                if (oldStatus.visible === false && newStatus.visible === true) {
                    this._makeVisible(true, customClasses);
                    this.onVisibleChanged.fireEvent({
                        tab: this.getWidgetContext().getWidgetNode(),
                        visible: true
                    });
                    this._tabStatus.visible = newStatus.visible;
                }
                if (oldStatus.visible === true && newStatus.visible === false) {
                    this._makeVisible(false, customClasses);
                    this.onVisibleChanged.fireEvent({
                        tab: this.getWidgetContext().getWidgetNode(),
                        visible: false
                    });
                    this._tabStatus.visible = newStatus.visible;
                }
            }

            if (!YAHOO.lang.isUndefined(newStatus.enabled)) {
                if (oldStatus.enabled === false && newStatus.enabled === true) {
                    this._makeEnabled(true, customClasses);
                    this.onEnabledChanged.fireEvent({
                        tab: this.getWidgetContext().getWidgetNode(),
                        enabled: true
                    });
                    this._tabStatus.enabled = newStatus.enabled;
                }
                if (oldStatus.enabled === true && newStatus.enabled === false) {
                    this._makeEnabled(false, customClasses);
                    this.onEnabledChanged.fireEvent({
                        tab: this.getWidgetContext().getWidgetNode(),
                        enabled: false
                    });
                    this._tabStatus.enabled = newStatus.enabled;
                }
            }
        },

        /**
         * Retrieve the content element
         */
        getContentElement: function(){
            return this.contentElement;
        },

        /**
         * Retrieve the container element
         */
        getContainerElement: function(){
            return this.contentElement;
        },

        _getTabset: function(){
            return this._tabset;
        },

        /**
         * Implements Widget.startup.
         *
         * Retrieves references to this widget's DOM elements and attached DOM events.
         *
         * @method startup
         * @param {WidgetContext} widgetContext
         */
        startup: function(widgetContext){
            Toronto.widget.core.v2_5_0.Tab.superclass.startup.apply(this, arguments);

            this._tabset = widgetContext.getWidgetNode().getParentNode().getWidget();
            if (isNaN(this.getTabIndex())) {
                throw new Error("Tab: Suppled tab index '" + this.getAttribute('tab-index') + "' is not valid");
            }

            this.activeTabElement = this.getNamedElement("active-tab");
            this.inactiveTabElement = this.getNamedElement("inactive-tab");
            this.contentElement = this.getNamedElement("content");
            this.tabsetBodyElement = this.contentElement.parentNode.parentNode;

            this._tabStatus.isCurrentTab = this._isFirstActive;
            this._tabStatus.visible = parseBoolean(this.getAttribute('visible'));
            this._tabStatus.enabled = parseBoolean(this.getAttribute('enabled'));

            if (this._tabStatus.enabled && this._tabStatus.visible && this._tabStatus.isCurrentTab) {
                var customClasses = this.getAttribute('class');
                customClasses = YAHOO.lang.isUndefined(customClasses) ? [] : customClasses.trim().split(/ +/);
                if (customClasses.length > 0) {
                    customClasses.doLoop(function(c){
                        Toronto.util.CssUtils.addClass(this.tabsetBodyElement, ("tab-" + c));
                    }, this);
                }
            }

            var clickEvent = new Toronto.client.Event("Tab onClick");
            this.inactiveTabElement.onclick = clickEvent.makeDOMEventFunction();
            clickEvent.bindHandler(this._setAsCurrentTab, this);

            // Stop click-and-drag events on the tabs
            var dragDisable = new Toronto.client.Event("Tab onMouseDown");
            this.inactiveTabElement.onmousedown = dragDisable.makeDOMEventFunction();
            dragDisable.bindHandler(this._dDhandle);

            this.getWidgetContext().getSystem().onUnload.bindHandler(this._cleanup, this);
        },

        _cleanup: function () {
            this._tabset            = null;
            this.activeTabElement   = null;
            this.inactiveTabElement = null;
            this.contentElement     = null;
            this.tabsetBodyElement  = null;
        },

        _dDhandle: function(e){
            if (YAHOO.env.ua.gecko) {
                e.preventDefault();
            }
        },

        /**
         * Retrieves the status of this tab (active or not)
         */
        isCurrentTab: function(){
            return this._tabStatus.isCurrentTab;
        },

        _setAsCurrentTab: function(){
            if (this._tabStatus.visible && this._tabStatus.enabled) {
                this._getTabset().setCurrentTab(this.getTabIndex());
                this.setCurrentTab(true);
            }
        },

        // The show operation is the same as making this tab current. If this tab is invisible,
        // it needs to be made visible before show will work.
        show: function(){
            // already shown or invisible or not enabled - do nothing silently
            if (!this._tabStatus.enabled || !this._tabStatus.visible || this._tabStatus.isCurrentTab) {
                return;
            }

            this._applyStatus({
                isCurrentTab: true
            });
        },

        // The show operation is the same as making this tab inactive.
        hide: function(){
            if (!this._tabStatus.enabled || !this._tabStatus.visible) {
                return;
            }
            this._applyStatus({
                isCurrentTab: false
            });
        },

        setCurrentTab: function(currentTab){
            if (parseBoolean(currentTab)) {
                this.show();
            }
            else {
                this.hide();
            }
        },

        setEnabled: function(enabled){
            var _enabled = parseBoolean(enabled);
            this._applyStatus({
                enabled: _enabled
            });
        },

        getEnabled: function(){
            return this._tabStatus.enabled;
        },

        setVisible: function(visible){
            var _visible = parseBoolean(visible);
            this._applyStatus({
                visible: _visible
            });
        },

        getVisible: function(){
            return this._tabStatus.visible;
        },

        isActive: function(){
            // is the tab alive? (on startup ...)
            // Only if we are the current tab should this part of the tree activated
            return this._isFirstActive;
        },

        isVisible: function(){
            // does the widget think i'm on the screen
            // Only if we are the current tab is this part of the tree visible
            return this.isActive();
        }
    });

})();
