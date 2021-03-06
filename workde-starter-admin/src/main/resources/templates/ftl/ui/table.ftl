<#--
表格标签：用于显示列表数据。
	value：列表数据，可以是Pagination也可以是List。
	class：table的class样式。默认"layui-table"。
	sytle：table的style样式。默认""。
	width：表格的宽度。默认100%。
-->
<#macro table value class="layui-table" style="" width="100%">
<table class="${class}" style="${style}" width="${width}" cellspacing="1" cellpadding="0" border="0">
    <#if value?is_sequence><#local pageList=value/><#else><#local pageList=value.list/></#if>
    <#assign i=-1/>
    <thead><tr><#nested {},i,true/></tr></thead>
<#list pageList as row>
    <#assign i=row_index has_next=row_has_next/>
    <#if row_index==0><tbody><tr><#else><tr></#if><#nested row,row_index,row_has_next/>
    <#if !row_has_next>
</tr></tbody>
    <#else>
</tr>
    </#if>
</#list>
    <#if pageList?size == 0>
        <tbody><tr><td colspan="100" align="center">暂无数据</td></tr></tbody>
    </#if>
</table>
</#macro>
