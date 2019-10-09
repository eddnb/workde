<#macro list_page value mm>
<@ui.table value=value;object,i><#rt/>
    <@ui.column title="序号" width="10%">${mm.page?string(i + value.startRow, i+1)}</@ui.column><#rt />
    <#list mm.fields as field>
        <@ui.column title=field.label width=field.width>
            <#if field.type == 'date' || field.format>
                ${(object[field.name].format(field.format))!}
            <#elseif field.type == 'switch'>
                <@ui.list_switch field=field value=object[field.name] />
            <#else>
                ${object[field.name]}
            </#if>
        </@ui.column><#rt />
    </#list>
    <@ui.column title="操作" width="10%">
        <a href="${object.id}" class="layui-btn layui-btn-xs">修改</a>
        <a href="${object.id}" class="layui-btn layui-btn-xs layui-btn-gray" data-remote="true" data-method="delete" data-confirm="你确定要删除吗?">删除</a>
    </@ui.column>
</@ui.table>
<#if mm.page && value.pages>
<@ui.page value />
</#if>
</#macro>

<#macro list_switch field value>
<input type="checkbox" value="true" lay-skin="switch" ${(value == 1 || value == "true")?string("checked", "")} />
</#macro>
