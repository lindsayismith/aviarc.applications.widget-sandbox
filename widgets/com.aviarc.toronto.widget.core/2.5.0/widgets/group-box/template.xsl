<xsl:stylesheet
     version="2"
     xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

     xmlns:aviarc="urn:aviarc:xslt-extension-elements/com.aviarc.framework.toronto.widget.xslt.XSLTExtensionElementFactory"
     xmlns:cssutils="java:com.aviarc.framework.toronto.util.CssUtils"
     xmlns:xsltutils="com.aviarc.framework.toronto.widget.xslt.XSLTUtils"
     
     extension-element-prefixes="aviarc"
     exclude-result-prefixes="aviarc cssutils xsltutils"
     >

    <xsl:template match="group-box">
      
        <xsl:variable name="css-prefix"><xsl:value-of select="xsltutils:getWidgetCSSPrefix()"/></xsl:variable>
        <xsl:variable name="invisible-style"><xsl:if test="xsltutils:isFalse(@visible)">display-none</xsl:if></xsl:variable>

        <div id="{@name}:div" class="{cssutils:makeClassString(concat($css-prefix, 'group-box'), @class)} {$invisible-style}"
                aviarc:positioning-attributes="position,float,width,height,left,top,right,bottom,margin-left,margin-right,margin-top,margin-bottom">

            <div class="{cssutils:makeClassString(concat($css-prefix, 'group-box-background'), @class)}"></div>

            <div class="{cssutils:makeClassString(concat($css-prefix, 'group-box-top'), @class)}">
                <div class="{cssutils:makeClassString(concat($css-prefix, 'group-box-top-left'), @class)}"></div>
                <div class="{cssutils:makeClassString(concat($css-prefix, 'group-box-top-horizontal'), @class)}"></div>
                <div class="{cssutils:makeClassString(concat($css-prefix, 'group-box-top-right'), @class)}"></div>
            </div>

            <div class="{cssutils:makeClassString(concat($css-prefix, 'group-box-bottom'), @class)}">
                <div class="{cssutils:makeClassString(concat($css-prefix, 'group-box-bottom-left'), @class)}"></div>
                <div class="{cssutils:makeClassString(concat($css-prefix, 'group-box-bottom-horizontal'), @class)}"></div>
                <div class="{cssutils:makeClassString(concat($css-prefix, 'group-box-bottom-right'), @class)}"></div>
            </div>

            <div class="{cssutils:makeClassString(concat($css-prefix, 'group-box-left'), @class)}"></div>
            <div class="{cssutils:makeClassString(concat($css-prefix, 'group-box-right'), @class)}"></div>
            <div id="{@name}:content" class="{cssutils:makeClassString(concat($css-prefix, 'group-box-content'), @class)}"
                    aviarc:positioning-attributes="padding-left,padding-right,padding-top,padding-bottom,overflow">
                <xsl:if test="@title">
                    <legend title="{@tooltip}">
                        <span class="{cssutils:makeClassString(concat($css-prefix, 'group-box-legend-container'), @class)}">
                            <span class="{cssutils:makeClassString(concat($css-prefix, 'group-box-legend-left'), @class)}"></span>
                            <span class="{cssutils:makeClassString(concat($css-prefix, 'group-box-legend-label'), @class)}">
                                <xsl:value-of select="@title"/>
                            </span>
                            <span class="{cssutils:makeClassString(concat($css-prefix, 'group-box-legend-right'), @class)}"></span>
                        </span>
                        <span class="{cssutils:makeClassString(concat($css-prefix, 'clear'), @class)}"></span>
                    </legend>
                </xsl:if>
                <aviarc:add-children/>
            </div>
        </div>
    </xsl:template>
</xsl:stylesheet>