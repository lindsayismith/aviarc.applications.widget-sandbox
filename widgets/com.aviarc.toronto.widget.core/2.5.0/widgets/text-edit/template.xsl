<xsl:stylesheet
     version="2"
     xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

     xmlns:aviarc="urn:aviarc:xslt-extension-elements/com.aviarc.framework.toronto.widget.xslt.XSLTExtensionElementFactory"
     xmlns:cssutils="java:com.aviarc.framework.toronto.util.CssUtils"
     xmlns:xsltutils="com.aviarc.framework.toronto.widget.xslt.XSLTUtils"
     
     extension-element-prefixes="aviarc"
     exclude-result-prefixes="aviarc cssutils xsltutils"
     >

    <xsl:template match="text-edit">
        
        <xsl:variable name="css-prefix"><xsl:value-of select="xsltutils:getWidgetCSSPrefix()"/></xsl:variable>
        <xsl:variable name="mandatory"><xsl:if test="xsltutils:isTrue(@mandatory)">mandatory</xsl:if></xsl:variable>
        
        <xsl:variable name="ds-ok">
            <xsl:choose>
                <xsl:when test="not(@field)">y</xsl:when>
                <xsl:when test="xsltutils:getDatasetCurrentRow(xsltutils:getDatasetName(@field))">y</xsl:when>
                <xsl:otherwise>n</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:variable name="disabled-class">
            <xsl:if test="xsltutils:isFalse(@enabled) or $ds-ok = 'n'">disabled</xsl:if>
        </xsl:variable>
        
        <xsl:variable name="class"><xsl:value-of select="concat(@class, ' ', $mandatory, ' ', $disabled-class)"/></xsl:variable>

        <xsl:variable name="invisible-style">
            <xsl:if test="xsltutils:isFalse(@visible)">display-none</xsl:if>
        </xsl:variable>

        <div id="{@name}:div" title="{@tooltip}" class="{cssutils:makeClassString(concat($css-prefix, 'text-edit'), $class)} {$invisible-style}">
            <div class="text-edit-outer">
                <div class="text-edit-inner">
                    <xsl:choose>
                        <xsl:when test="xsltutils:isFalse(@multi-line)">
                            <xsl:choose>
                                <xsl:when test="@datatype='password'">
                                    <input id="{@name}:input" type="password" />
                                </xsl:when>
                                <xsl:otherwise>
                                    <input id="{@name}:input" />
                                </xsl:otherwise>
                            </xsl:choose>
                        </xsl:when>
                        <xsl:otherwise>
                            <textarea id="{@name}:input" />
                        </xsl:otherwise>
                    </xsl:choose>
                    <div class="text-edit-disabled-container">  
                    </div>
                </div>
            
                <xsl:if test="@show-type = 'y'">
                    <span id="{@name}:input-mask" class="text-edit-datatype">
                        <!-- Now handled by DataConvertorImpl.js
                        <xsl:choose>
                            <xsl:when test="@datatype = 'year'">(yyyy)</xsl:when>
                            <xsl:when test="@datatype = 'month-year'">(yyyy-mm)</xsl:when>
                            <xsl:when test="@datatype = 'date'">(yyyy-mm-dd)</xsl:when>
                            <xsl:when test="@datatype = 'datetime'">(yyyy-mm-dd hh:mm)</xsl:when>
                            <xsl:when test="@datatype = 'time'">(hh:mm)</xsl:when>
                            <xsl:when test="@datatype = 'boolean'">(y/n)</xsl:when>
                            <xsl:when test="@datatype = 'float'">(number)</xsl:when>
                            <xsl:when test="@datatype = 'decimal'">(number)</xsl:when>
                            <xsl:when test="@datatype = 'number'">(number)</xsl:when>
                            <xsl:when test="@datatype = 'integer'">(number)</xsl:when>
                            <xsl:when test="@datatype = 'currency'">($)</xsl:when>
                        </xsl:choose>
                        -->
                    </span>
                </xsl:if>
            
                <xsl:variable name="mandatory-style">
                    <xsl:if test="xsltutils:isFalse(@mandatory)">display-none</xsl:if>
                </xsl:variable>

                <div id="{@name}:mandatory" class="text-edit-mandatory {$mandatory-style}" title="This field is mandatory.">
                    This field is mandatory.
                </div>

                <xsl:if test="@datatype='password'">
                    <div id="{@name}:capslock" class="text-edit-capslock display-none" title="CapsLock is enabled.">
                        CapsLock is enabled.
                    </div>
                </xsl:if>
            </div>
        </div>
    </xsl:template>
</xsl:stylesheet>
