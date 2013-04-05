/*global
YAHOO
*/

(function () {

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    Toronto.widget.core.v2_5_0.Screen = function () {
        this.onResize = new Toronto.client.Event("Screen onResize");
    };

    YAHOO.lang.extend(Toronto.widget.core.v2_5_0.Screen, Toronto.framework.DefaultWidgetImpl, {

        startup: function (widgetContext) {
            Toronto.widget.core.v2_5_0.Screen.superclass.startup.apply(this, arguments);

            // Disable screen timer
            if (!parseBoolean(this.getAttribute('timer'))) {
                widgetContext.getSystem().disableTimer();
            }

            window.onresize = this.onResize.makeDOMEventFunction();
        },

        getContentElement: function() {
            return this.getNamedElement("div");
        },

        isActive: function () {
            return true;
        },

        isVisible: function () {
            return true;
        }
    });

})();
