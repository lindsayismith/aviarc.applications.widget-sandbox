/*global
YAHOO
escapeHTML
*/

(function () {

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    /**
    * @module toronto.widget
    * @class TextStatic
    */
    Toronto.widget.core.v2_5_0.TextStatic = function () {
        this.onTextChanged = new Toronto.client.Event("TextStatic onTextChanged");
        this.onClick = new Toronto.client.Event("TextStatic onClick");
    };

    YAHOO.lang.extend(Toronto.widget.core.v2_5_0.TextStatic, Toronto.framework.DefaultWidgetImpl, {

    	startup: function (widgetContext) {
    		Toronto.widget.core.v2_5_0.TextStatic.superclass.startup.apply(this, arguments);

            var container = this.getContainerElement();
            var clickedEvent = widgetContext.createManagedEvent("TextStatic onclick ManagedEvent");
            container.onclick = clickedEvent.makeDOMEventFunction({
                returnValue: false
            });
            clickedEvent.bindHandler(this._click, this);
    	},

        setText: function (text) {
            text = escapeHTML(text);
            var oldText = this.getText();
            if (text !== oldText) {
                this.getContainerElement().innerHTML = text;
                this.onTextChanged.fireEvent({
                    newText: text,
                    oldText: oldText
                });
            }
        },

        getText: function () {
            return this.getContainerElement().innerHTML.trim();
        },

        _click : function() {
            var action = this.getAttribute('action');

            // Fire the onClick event
            this.onClick.fireEvent({
                widget: this,
                action: action
            });

            // If there is an action, lets hit it.
            if (!YAHOO.lang.isUndefined(action)) {
                this.getWidgetContext().getSystem().submitScreen({
                    action: action
                });
            }
        }
    });
    YAHOO.lang.augmentProto(Toronto.widget.core.v2_5_0.TextStatic, Toronto.util.CssUtils);

})();
