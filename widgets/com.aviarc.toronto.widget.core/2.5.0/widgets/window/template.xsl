<xsl:stylesheet
     version="2"
     xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

     xmlns:aviarc="urn:aviarc:xslt-extension-elements/com.aviarc.framework.toronto.widget.xslt.XSLTExtensionElementFactory"
     xmlns:cssutils="java:com.aviarc.framework.toronto.util.CssUtils"
     xmlns:xsltutils="com.aviarc.framework.toronto.widget.xslt.XSLTUtils"
     
     extension-element-prefixes="aviarc"
     exclude-result-prefixes="aviarc cssutils xsltutils"
     >
    
    <xsl:template match="window">

        <xsl:variable name="css-prefix"><xsl:value-of select="xsltutils:getWidgetCSSPrefix()"/></xsl:variable>

        <xsl:variable name="visibility">
            <xsl:if test="xsltutils:isFalse(@visible)">display-none</xsl:if>
        </xsl:variable>

        <xsl:variable name="resizerdisplay">
            <xsl:choose>
                <xsl:when test="xsltutils:isTrue(@resizable)">inline</xsl:when>
                <xsl:otherwise>none</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        
        <xsl:variable name="closebuttonclass">
            <xsl:choose>
                <xsl:when test="xsltutils:isTrue(@closable)"><xsl:value-of select="$css-prefix"/>window-button-close</xsl:when>
                <xsl:otherwise><xsl:value-of select="$css-prefix"/>window-button-close-disabled</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        
        <xsl:variable name="minimizebuttonclass">
            <xsl:choose>
                <xsl:when test="xsltutils:isTrue(@minimizable) and (@minimized-width!='') and (@minimized-height!='')"></xsl:when>
                <xsl:otherwise>display-none</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>

        <div id="{@name}:div"
             class="{cssutils:makeClassString(concat($css-prefix, 'window'), @class)} {$visibility}"
             style="left:{@left}px; top:{@top}px; width:{@width}px; height:{@height}px">
             
            <!-- If we don't put in src="javascript:false;", then IE6 complains about security when using https -->
            <iframe id="{@name}:iframe" class="{concat($css-prefix, 'window-iframe')}" frameborder="no" src="javascript:false;" />
            <div class="{cssutils:makeClassString(concat($css-prefix, 'window-background'), @class)}"></div>
            <div class="{cssutils:makeClassString(concat($css-prefix, 'window-top'), @class)}" id="{@name}:header:div" title="{@tooltip}">
                <div class="{cssutils:makeClassString(concat($css-prefix, 'window-top-left'), @class)}" />
                <div class="{cssutils:makeClassString(concat($css-prefix, 'window-top-right'), @class)}" />
                <div class="{cssutils:makeClassString(concat($css-prefix, 'window-top-middle'), @class)}">
                    <h5 id="{@name}:title"><xsl:value-of select="@title"/></h5>
                </div>
                <div class="{cssutils:makeClassString(concat($css-prefix, 'window-actions'), @class)}">
                    <div class="{cssutils:makeClassString(concat($css-prefix, 'window-icon'), @class)}" title="Move aviarc window" />
                    <div class="{cssutils:makeClassString(concat($css-prefix, 'window-buttons'), @class)}">
                        <div class="{$closebuttonclass}" id="{@name}:caption-close:div" title="{@close-button-tooltip}"/>
                        <div class="{cssutils:makeClassString(concat($css-prefix, 'window-button-minimize'), @class)} {$minimizebuttonclass}" id="{@name}:caption-minimize:div"  title="{@minimize-button-tooltip}"/>
                        <div class="{cssutils:makeClassString(concat($css-prefix, 'window-button-maximize'), @class)} display-none" id="{@name}:caption-maximize:div" title="{@maximize-button-tooltip}"/>
                    </div>
                </div>
            </div>
            
            <div class="{cssutils:makeClassString(concat($css-prefix, 'window-bottom'), @class)}">
                <div class="{cssutils:makeClassString(concat($css-prefix, 'window-bottom-left'), @class)}" />
                <div class="{cssutils:makeClassString(concat($css-prefix, 'window-bottom-right'), @class)}" id="{@name}:resizer:div">
                    <div style="display:{$resizerdisplay}"/>
                </div>
                <div class="{cssutils:makeClassString(concat($css-prefix, 'window-bottom-middle'), @class)}">
                    <dl>
                        <dt id="{@name}:footer"><xsl:value-of select="@footer-text"/></dt>
                    </dl>
                </div>
            </div>
            
            <div class="{cssutils:makeClassString(concat($css-prefix, 'window-middle'), @class)}">
                <div class="{cssutils:makeClassString(concat($css-prefix, 'window-middle-left'), @class)}" />
                <div class="{cssutils:makeClassString(concat($css-prefix, 'window-middle-right'), @class)}" />
                
                
                <div class="{cssutils:makeClassString(concat($css-prefix, 'window-content'), @class)}" id="{@name}:content:div">
                    <!-- Window content goes here -->
                    <aviarc:add-children/>
                </div>
            </div>
        </div>
        
    </xsl:template>
    
</xsl:stylesheet>