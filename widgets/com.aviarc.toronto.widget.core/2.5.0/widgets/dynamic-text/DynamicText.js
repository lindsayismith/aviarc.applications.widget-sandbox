/*global
YAHOO
escapeHTML
*/

(function () {

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    Toronto.widget.core.v2_5_0.DynamicText = function () {

    };

    YAHOO.lang.extend(Toronto.widget.core.v2_5_0.DynamicText, Toronto.framework.DefaultWidgetImpl, {
        getDisplayName: function () {
            return this.getAttribute('display-name') || this.getWidgetID();
        },

        startup: function (widgetContext) {
            Toronto.widget.core.v2_5_0.DynamicText.superclass.startup.apply(this, arguments);

            // Split dataset/field if we are bound
            if (this.getAttribute("field")) {
                this._field = this.getAttribute("field").split(".");
                this._isBound = true;
            } else {
                this._isBound = false;
            }
        },

        bind: function (dataContext) {
            Toronto.widget.core.v2_5_0.DynamicText.superclass.bind.apply(this, arguments);

            if (!this._isBound) {
                return;
            }

            this._ds = dataContext.findDataset(this._field[0]);
            this._dsChangeHandler = this._ds.bindOnCurrentRowFieldChangedHandler(this._field[1], this.refresh, this);
            this._ds.onCurrentRowChanged.bindHandler(this.refresh, this);
            this._ds.onContentsReplaced.bindHandler(this.refresh, this);
        },

        refresh: function () {
            if (!this._isBound) {
                return;
            }

            var containerEl = this.getContainerElement();

            if (this._ds.getCurrentRow() === null) {
                containerEl.innerHTML = "";
                return;
            }

            var text = this._ds.getCurrentRow().getFieldObject(this._field[1]).getFormattedValue();
            if (containerEl) {
                containerEl.innerHTML = escapeHTML(text);
            }
        }
    });

})();