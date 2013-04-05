<xsl:stylesheet
     version="2"
     xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

     xmlns:aviarc="urn:aviarc:xslt-extension-elements/com.aviarc.framework.toronto.widget.xslt.XSLTExtensionElementFactory"
     xmlns:cssutils="java:com.aviarc.framework.toronto.util.CssUtils"
     xmlns:xsltutils="com.aviarc.framework.toronto.widget.xslt.XSLTUtils"
     
     extension-element-prefixes="aviarc"
     exclude-result-prefixes="aviarc cssutils xsltutils"
     >

    <xsl:template match="button">

        <xsl:variable name="css-prefix"><xsl:value-of select="xsltutils:getWidgetCSSPrefix()"/></xsl:variable>


        <xsl:variable name="disabled-class">
            <xsl:if test="xsltutils:isFalse(@enabled)">disabled</xsl:if>
        </xsl:variable>

        <xsl:variable name="class"><xsl:value-of select="concat(@class, ' ', $disabled-class)"/></xsl:variable>

        <!-- validator rules ensure we only get one of enabled-if-dataset/disabled-if-dataset
             fallback to @enabled if neither is set -->
        <xsl:variable name="enabled">
            <xsl:choose>
                <xsl:when test="@enabled-if-dataset">
                    <xsl:choose>
                        <xsl:when test="xsltutils:getDatasetRowCount(@enabled-if-dataset) > 0">y</xsl:when>
                        <xsl:otherwise>n</xsl:otherwise>
                    </xsl:choose>
                </xsl:when>
                <xsl:when test="@disabled-if-dataset">
                    <xsl:choose>
                        <xsl:when test="xsltutils:getDatasetRowCount(@disabled-if-dataset) = 0">y</xsl:when>
                        <xsl:otherwise>n</xsl:otherwise>
                    </xsl:choose>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:choose>
                        <xsl:when test="xsltutils:isTrue(@enabled)">y</xsl:when>
                        <xsl:otherwise>n</xsl:otherwise>
                    </xsl:choose>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>

        <xsl:variable name="visible">
            <xsl:choose>
                <xsl:when test="@visible-if-dataset">
                    <xsl:choose>
                        <xsl:when test="xsltutils:getDatasetRowCount(@visible-if-dataset) > 0">y</xsl:when>
                        <xsl:otherwise>n</xsl:otherwise>
                    </xsl:choose>
                </xsl:when>
                <xsl:when test="@invisible-if-dataset">
                    <xsl:choose>
                        <xsl:when test="xsltutils:getDatasetRowCount(@invisible-if-dataset) = 0">y</xsl:when>
                        <xsl:otherwise>n</xsl:otherwise>
                    </xsl:choose>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:choose>
                        <xsl:when test="xsltutils:isTrue(@visible)">y</xsl:when>
                        <xsl:otherwise>n</xsl:otherwise>
                    </xsl:choose>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        
        <xsl:variable name="invisible-class">
            <xsl:if test="xsltutils:isFalse($visible)">display-none</xsl:if>
        </xsl:variable>
        
        <xsl:variable name="content">
            <span class="button-top">
                <span class="button-top-left"></span>
                <span class="button-top-middle"></span>
                <span class="button-top-right"></span>
            </span>
            <span class="button-bottom">
                <span class="button-bottom-left"></span>
                <span class="button-bottom-middle"></span>
                <span class="button-bottom-right"></span>
            </span>
            <span class="button-container">
                <span class="button-container-top">
                    <span class="button-decoration-top"></span>
                </span>
                <span class="button-container-left">
                    <span class="button-decoration-left"></span>
                </span>	
                <span class="button-container-inner">
                    <xsl:value-of select="@label"/>
                </span>
                <span class="button-container-right">
                    <span class="button-decoration-right"></span>
                </span>
                <span class="button-container-bottom">
                    <span class="button-decoration-bottom"></span>
                </span>
            </span>
        </xsl:variable>
        
        <div id="{@name}:div" class="{cssutils:makeClassString(concat($css-prefix, 'button'), $class)} {$invisible-class}" title="{@tooltip}">
            
            <a href="javascript:void(0);"
               title="{@tooltip}"
               class="button-anchor">
                <xsl:if test="xsltutils:isTrue($enabled)">
                    <xsl:copy-of select="$content" />
                </xsl:if>
            </a>

            <span class="button-disabled-span">
                <xsl:if test="xsltutils:isFalse($enabled)">
                    <xsl:copy-of select="$content" />
                </xsl:if>
            </span>
        </div>
    </xsl:template>
    
</xsl:stylesheet>