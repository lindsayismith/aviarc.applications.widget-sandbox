(function () {

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;
    var L = YAHOO.lang;

    // marker object for force refreshes
    var REFRESH = {};

    /**
    * The com.aviarc.toronto.widget.core.2.5.0 button.
    *
    * @class Button
    */
    Toronto.widget.core.v2_5_0.Button = function (validationContext) {
        this.onClick = new Toronto.client.Event("Button onClick");
        this.onBeforeClick = new Toronto.client.Event("Button onBeforeClick");
        this.onEnabledChanged = new Toronto.client.Event("Button onEnabledChanged");
        this.onLabelChanged = new Toronto.client.Event("Button onLabelChanged");

        this._validationContext = validationContext;
    };

    L.extend(Toronto.widget.core.v2_5_0.Button, Toronto.framework.DefaultWidgetImpl, {
    /**
    * Implements {@link Toronto.core.Widget#startup}
    */
        startup: function (widgetContext) {
            Toronto.widget.core.v2_5_0.Button.superclass.startup.apply(this, arguments);

            var containerDiv = this.getContainerElement();
            var anchor = containerDiv.firstChild;
            var span = containerDiv.lastChild;

            var clickedEvent = widgetContext.createManagedEvent("Button onclick ManagedEvent");
            anchor.onclick = clickedEvent.makeDOMEventFunction({
                returnValue: false
            });

            clickedEvent.bindHandler(this.click, this);

            this.elements = {
                anchor: anchor,
                span: span
            };

            this._enabled = parseBoolean(this.getAttribute('enabled'));
            this._autoRefresh = parseBoolean(this.getAttribute('auto-refresh'));

            if (this._enabled && parseBoolean(this.getAttribute('focus'))) {
                this.focus();
            }

            this.getWidgetContext().getSystem().onUnload.bindHandler(this._cleanup, this);

        },

        _cleanup: function () {
             this.elements.anchor.onclick = null;
             this.elements = null;
        },

        /**
         * Click this button.  Behaves in the same was as if the button were clicked in the browser.
         */
        click: function (context) {
            if (!this.getEnabled()) {
                return;
            }

            var action = this.getAttribute('action') || null;

            var noValidateActions = [
                "Restart",
                "Cancel",
                "Undo",
                "Logout"
            ];

            // should the page be stopped submitting if their are DataRule invalid rows in the post.

            var validate = parseBoolean(this.getAttribute('validate'));
            var serverValidate = parseBoolean(this.getAttribute('server-validate') || validate );
            if (noValidateActions.contains(action) ) {
                serverValidate = false;
            }

            var confirmMessage = this.getAttribute('confirm');
            var me = this;

            var callback = function(context){
                // Validation Failure
                if (context.result.length > 0){
                    return;
                }

                if(L.isUndefined(confirmMessage) || confirm(confirmMessage)){
                     // fire onclick if validation has succeeded
                    me.onClick.fireEvent({
                        widget: me.getWidgetContext().getWidgetNode(),
                        action: action
                    });

                    // If there is an action, perform it.
                    if (action !== null) {
                        me.getWidgetContext().getSystem().submitScreen({
                            action: action,
                            validate: false,
                            serverValidate: serverValidate,
                            validationContext: me._validationContext
                        });
                    }
                }
            };

            var forceServerValidate = false;
            if (validate && !noValidateActions.contains(action)){
                if (L.isNull(action)){
                    forceServerValidate = true;
                }

                return this.getWidgetContext().getSystem().validate({
                            serverValidate: serverValidate,
                            forceServerValidate: forceServerValidate,
                            validationContext: this._validationContext,
                            callback : callback
                });
            }
            return callback({'result':[]});
        },

        focus: function () {
            this.elements.anchor.focus();
        },

        /**
         * Whether this button is currently enabled.
         *
         * @return {Boolean} True if this button is currently enabled.
         */
        getEnabled: function () {
            return this._enabled;
        },


        /**
         * Implements {@link Toronto.core.widget#bind}
         */
        bind: function (dataContext) {
            Toronto.widget.core.v2_5_0.Button.superclass.bind.apply(this, arguments);

            var me = this;
            var attr = this.getAttributes();

            var bindings = [];
            var bind = function (dsName, lambda) {
                var dataset = dataContext.findDataset(dsName);
                bindings.push(dataset.onDataChanged.bindHandler(function (e) {
                    // Do nothing if auto refresh is disabled
                    if (e !== REFRESH && !me._autoRefresh) {
                        return;
                    }
                    lambda(dataset.getRowCount() === 0);
                }));
            };
            this._datasetEventBindings = bindings;

            var enabledIfDataset = attr['enabled-if-dataset'];
            var disabledIfDataset = attr['disabled-if-dataset'];
            if (!L.isUndefined(enabledIfDataset)) {
                bind(enabledIfDataset, function (datasetEmpty) {
                    me.setEnabled(!datasetEmpty);
                });
                me.setEnabled(dataContext.findDataset(enabledIfDataset).getRowCount() > 0);
            } else if (!L.isUndefined(disabledIfDataset)) {
                bind(disabledIfDataset, function (datasetEmpty) {
                    me.setEnabled(datasetEmpty);
                });
                me.setEnabled(dataContext.findDataset(disabledIfDataset).getRowCount() === 0);
            }

            var visibleIfDataset = attr['visible-if-dataset'];
            var invisibleIfDataset = attr['invisible-if-dataset'];
            if (!L.isUndefined(visibleIfDataset)) {
                bind(visibleIfDataset, function (datasetEmpty) {
                    if (datasetEmpty) {
                        // Hidden but still active so that dataset events come through
                        me.getWidgetContext().getWidgetNode().hide(false);
                    } else {
                        me.getWidgetContext().getWidgetNode().show();
                    }
                });
            } else if (!L.isUndefined(invisibleIfDataset)) {
                bind(invisibleIfDataset, function (datasetEmpty) {
                    if (datasetEmpty) {
                        me.getWidgetContext().getWidgetNode().show();
                    } else {
                        // Hidden but still active so that dataset events come through
                        me.getWidgetContext().getWidgetNode().hide(false);
                    }
                });
            }
        },

        /**
         * Alter this button's enabled state.
         *
         * @param enabled {Boolean|String} The button's new enabled state
         */
        setEnabled: function (enabled) {
            enabled = parseBoolean(enabled);
            var oldEnabled = this._enabled;
            if (enabled !== oldEnabled) {
                if (enabled) {
                    this._moveChildren(this.elements.span, this.elements.anchor);
                    this.removeClass("disabled");
                } else {
                    this._moveChildren(this.elements.anchor, this.elements.span);
                    this.addClass("disabled");
                }
                this._enabled = enabled;
                this.onEnabledChanged.fireEvent({
                    widget: this.getWidgetContext().getWidgetNode(),
                    enabled: enabled
                });
            }
        },

        _moveChildren : function(srcElement, targetElement) {
            while (srcElement.firstChild) {
                targetElement.appendChild(srcElement.firstChild);
            }
        },

        /**
         * Implements {@link Toronto.core.Widget#refresh}
         */
        refresh: function () {
            this._datasetEventBindings.doLoop(function (binding) {
                binding.run(REFRESH);
            });
        },

        /**
         * Implements {@link Toronto.framework.CSSUtils#getStyledElements}
         */
        getStyledElements: function () {
            var containerDiv = this.getContainerElement();
            var elems = [containerDiv];
            var allChildren = containerDiv.getElementsByTagName("*");
            for (var i = 0; i < allChildren.length; i += 1) {
                elems.push(allChildren[i]);
            }
            return elems;
        },

        _getLabelElement : function() {
            var labelAncestor =  this.getEnabled() ? this.elements.anchor : this.elements.span;
            return labelAncestor.lastChild.childNodes[2];
        },

        /**
         * Alter the label text on this button.
         *
         * @param newLabel {String} The new label for this button
         */
        setLabel: function (newLabel) {
            var labelElement = this._getLabelElement();
            var oldLabel = labelElement.innerHTML.trim();
            newLabel = escapeHTML(newLabel);
            if (newLabel !== oldLabel) {
                labelElement.innerHTML = newLabel;

                this.onLabelChanged.fireEvent({
                    widget: this,
                    label: newLabel,
                    oldLabel: oldLabel
                });
            }
        },

        /**
         * Retrieve the label from this button
         *
         * @return {String} The current label on this button
         */
        getLabel: function () {
            return this._getLabelElement().innerHTML.trim();
        },

        setAutoRefresh: function (autoRefresh) {
            this._autoRefresh = parseBoolean(autoRefresh);
        },
        getAutoRefresh: function () {
            return this._autoRefresh;
        }
    });

    L.augmentProto(Toronto.widget.core.v2_5_0.Button, Toronto.util.CssUtils);
})();
