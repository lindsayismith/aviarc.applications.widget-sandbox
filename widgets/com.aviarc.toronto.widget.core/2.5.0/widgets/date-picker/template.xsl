<xsl:stylesheet
     version="2"
     xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

     xmlns:aviarc="urn:aviarc:xslt-extension-elements/com.aviarc.framework.toronto.widget.xslt.XSLTExtensionElementFactory"
     xmlns:cssutils="java:com.aviarc.framework.toronto.util.CssUtils"
     xmlns:xsltutils="com.aviarc.framework.toronto.widget.xslt.XSLTUtils"

     extension-element-prefixes="aviarc"
     exclude-result-prefixes="aviarc cssutils xsltutils"
     >

    <xsl:template match="date-picker">

        <xsl:variable name="css-prefix"><xsl:value-of select="xsltutils:getWidgetCSSPrefix()"/></xsl:variable>
        
        <xsl:variable name="disabled-class">
            <xsl:if test="xsltutils:isFalse(@enabled)">disabled</xsl:if>
        </xsl:variable>
        <xsl:variable name="mandatory"><xsl:if test="xsltutils:isTrue(@mandatory)">mandatory</xsl:if></xsl:variable>
        
        <xsl:variable name="class"><xsl:value-of select="concat(@class, ' ', $mandatory, ' ', $disabled-class)"/></xsl:variable>
        <xsl:variable name="wrapper-invisible-class">
            <xsl:if test="xsltutils:isFalse(@visible)">display-none</xsl:if>
        </xsl:variable>

        <xsl:variable name="calendar-invisible-class">
            <xsl:if test="xsltutils:isTrue(@popup)">display-none</xsl:if>
        </xsl:variable>

        <xsl:variable name="popup-button-invisible-class">
            <xsl:if test="xsltutils:isFalse(@popup)">display-none</xsl:if>
        </xsl:variable>

        <xsl:variable name="disable-div-invisible-class">
            <xsl:if test="xsltutils:getDatasetCurrentRow(xsltutils:getDatasetName(@field)) and xsltutils:isTrue(@enabled)">display-none</xsl:if>
        </xsl:variable>

        <div id="{@name}:div" class="{cssutils:makeClassString(concat($css-prefix, 'date-picker-wrapper'), $class)} {$wrapper-invisible-class}" style="overflow: auto;">
            <div id="{@name}:popup-button" class="date-picker-button {$popup-button-invisible-class}">
                <div class="date-picker-button-icon"></div>
            </div>
            <div id="{@name}:calendar" class="{cssutils:makeClassString(concat($css-prefix, 'date-picker'), @class)} {$calendar-invisible-class}"></div>
            <div id="{@name}:disable-div" class="underlay {$disable-div-invisible-class}"></div>

            <xsl:variable name="mandatory-style">
                <xsl:if test="xsltutils:isFalse(@mandatory)">display-none</xsl:if>
            </xsl:variable>
            <div id="{@name}:mandatory" class="date-picker-mandatory {$mandatory-style}" title="This field is mandatory.">
                This field is mandatory.
            </div>

        </div>

    </xsl:template>

</xsl:stylesheet>