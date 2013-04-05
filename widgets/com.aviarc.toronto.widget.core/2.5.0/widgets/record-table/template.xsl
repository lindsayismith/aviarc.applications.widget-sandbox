<xsl:stylesheet
     version="2"
     xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

     xmlns:aviarc="urn:aviarc:xslt-extension-elements/com.aviarc.framework.toronto.widget.xslt.XSLTExtensionElementFactory"
     xmlns:cssutils="java:com.aviarc.framework.toronto.util.CssUtils"
     xmlns:xsltutils="com.aviarc.framework.toronto.widget.xslt.XSLTUtils"
     
     extension-element-prefixes="aviarc"
     exclude-result-prefixes="aviarc cssutils xsltutils"
     >

    <xsl:template match="record-table">

        <xsl:variable name="css-prefix"><xsl:value-of select="xsltutils:getWidgetCSSPrefix()"/></xsl:variable>

        <xsl:variable name="invisible-style">
            <xsl:choose>
                <xsl:when test="xsltutils:isFalse(@visible)">display-none</xsl:when>
                <xsl:otherwise></xsl:otherwise>
            </xsl:choose>
        </xsl:variable>

        <xsl:variable name="disable-div-invisible-class">
            <xsl:if test="xsltutils:isTrue(@enabled)">display-none</xsl:if>
        </xsl:variable>

        <xsl:variable name="container-min-width">
            <xsl:if test="@container-min-width">min-width:<xsl:value-of select="@container-min-width"/>px;</xsl:if>
        </xsl:variable>
        <xsl:variable name="container-max-width">
            <xsl:if test="@container-max-width">max-width:<xsl:value-of select="@container-max-width"/>px;</xsl:if>
        </xsl:variable>
        <xsl:variable name="table-min-width">
            <xsl:if test="@table-min-width">min-width:<xsl:value-of select="@table-min-width"/>px;</xsl:if>
        </xsl:variable>

        <div id="{@name}:div"
             class="{cssutils:makeClassString(concat($css-prefix, 'record-table'), @class)} {$invisible-style}"
             style="{$container-min-width} {$container-max-width}">

            <div class="record-table-container">
                <div id="{@name}:table-container-inner" class="record-table-container-inner" style="{$table-min-width}">
                    <div id="{@name}:header" class="record-table-header">
                        <table>
                            <tbody>
                                <tr class="header" id="{@name}:header-table"></tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="{@name}:body-div" class="record-table-body">
                        <div>
                            <table>
                                <tbody id="{@name}:body-table"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div id="{@name}:fake-scroller" class="record-table-scroller display-none">
                <div class="record-table-scroller-height"></div>
            </div>

            <!-- Borders  -->
            <div class="record-table-border-top">
                <div class="record-table-border-top-left"></div>
                <div class="record-table-border-top-horizontal"></div>
                <div class="record-table-border-top-right"></div>
            </div>
            <div class="record-table-border-bottom">
                <div class="record-table-border-bottom-left"></div>
                <div class="record-table-border-bottom-horizontal"></div>
                <div class="record-table-border-bottom-right"></div>
            </div>
            <div class="record-table-border-left"></div>
            <div class="record-table-border-right"></div>

            <div id="{@name}:disable-div" class="underlay {$disable-div-invisible-class}"></div>

        </div>

    </xsl:template>
</xsl:stylesheet>
