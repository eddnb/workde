var Ide = {
    backList: [],
    forwardList: [],
    controlDefines: {
        datetimefield: {
            type: "datetime",
            iconCls: "datetime_icon"
        },
        datefield: {
            type: "date",
            iconCls: "date_icon"
        },
        timefield: {
            type: "time",
            iconCls: "time_icon"
        },
        numberfield: {
            type: "number",
            iconCls: "ne_icon"
        },
        textfield: {
            type: "text",
            iconCls: "te_icon"
        },
        textarea: {
            type: "textarea",
            iconCls: "textarea_icon"
        },
        combo: {
            type: "combo",
            iconCls: "combobox_icon"
        },
        blob: {
            type: "file",
            iconCls: "file_default_icon"
        }
    },
    init: function() {
        Ide.activeCard = null;
        Ide.activeScope = null;
        Ide.defineClasses();
        Ide.objectViewMenu = new Ext.menu.Menu({
            minWidth: 210,
            items: [{
                text: "剪切<span class='wb_right'>Ctrl+X</span>",
                iconCls: "cut_icon",
                handler: app.cut
            }, {
                text: "复制<span class='wb_right'>Ctrl+C</span>",
                iconCls: "copy_icon",
                handler: app.copy
            }, {
                text: "粘贴<span class='wb_right'>Ctrl+V</span>",
                iconCls: "paste_icon",
                handler: app.paste
            }, {
                text: "粘贴为子节点<span class='wb_right'>Ctrl+Shift+V</span>",
                iconCls: "tree_icon",
                handler: function() {
                    app.pasteNode(true)
                }
            }, {
                text: "删除<span class='wb_right'>Delete</span>",
                iconCls: "delete_icon",
                handler: app.remove
            }, "-", {
                text: "布局设计器<span class='wb_right'>Ctrl+B</span>",
                iconCls: "window_icon",
                handler: app.setLayout
            }, {
                text: "自动调整控件顺序<span class='wb_right'>Ctrl+Shift+U</span>",
                iconCls: "order_icon",
                handler: app.adjustZIndex
            }, "-", {
                text: "自动生成表格列",
                iconCls: "columns_icon",
                handler: app.createColumns
            }, {
                text: "自动添加编辑控件",
                iconCls: "te_icon",
                handler: app.createEditors
            }]
        });
        Wb.onUnload(function() {
            var a = Wb.getModifiedTitle(Ide.fileTab, true);
            if (a !== null) {
                return a + "已经被修改"
            }
        });
        Wb.request({
            url: "builder?xwl=dev/ide/get-sys-data",
            success: function(a) {
                Ext.apply(Ide, Wb.decode(a.responseText));
                Wb.each(Ide.cmPickList, function(c, b) {
                    Ide.cmPickList[c] = Wb.sort(b)
                });
                if (Ide.versionType != "x") {
                    Ide.getStdPackBtn.setVisible(false);
                    Ide.getEntPackBtn.setVisible(false);
                    Ide.getRelPackBtn.setText("发布版本")
                }
            }
        })
    },
    search: function() {
        Ide.findReplace()
    },
    searchAgain: function() {
        if (Ide.searchGrid.searched) {
            Ide.searchGrid.store.reload()
        } else {
            Ide.search()
        }
    },
    showSearch: function() {
        Ide.toggleViewBtn.toggle(true);
        Ide.utilView.setActiveTab(Ide.searchGrid)
    },
    searchKey: function(a) {
        Ide.searchGrid.store.load({
            params: {
                search: a,
                pathList: Wb.encode([Ide.webPath]),
                filePatterns: "*.xwl,*.js,*.css,*.html,*.htm,*.java,*.jsp",
                regularExp: true,
                isReplace: false
            },
            callback: function(d, c, e) {
                if (e) {
                    Ide.showSearch()
                }
                Ide.searchGrid.searched = true
            }
        })
    },
    searchTodo: function() {
        Ide.searchKey("\\bTODO:")
    },
    replace: function() {
        Ide.findReplace(true)
    },
    findReplace: function(e) {
        var a, c = Ide.fileTree.getSelection(),
            b = Ide.getEditor(),
            f;
        if (!c.length) {
            c.push(Ide.fileTree.getRootNode().firstChild)
        }
        if (b) {
            f = b.getSelection()
        }
        a = [{
            xtype: "combo",
            fieldLabel: "搜索内容",
            itemId: "search",
            allowBlank: false,
            saveKeyname: "sys.ide.find.find",
            pickKeyname: "sys.ide.find.find",
            store: []
        }, {
            xtype: "combo",
            fieldLabel: "文件类型",
            itemId: "filePatterns",
            pickKeyname: "sys.ide.find.filePatterns",
            value: "*.xwl, *.js, *.css, *.html, *.htm, *.java, *.jsp",
            saveKeyname: "sys.ide.find.filePatterns",
            store: ["*.xwl, *.js, *.css, *.html, *.htm, *.java, *.jsp", "*.xwl", "*.js", "*.htm, *.html", "*.css", "*.java", "*.jsp, *.jspx"]
        }, {
            xtype: "radiogroup",
            fieldLabel: "检索目录",
            itemId: "scope",
            saveKeyname: "sys.ide.find.scope",
            items: [{
                boxLabel: "应用",
                value: true
            }, {
                boxLabel: "模块"
            }, {
                boxLabel: "选择"
            }, {
                boxLabel: "当前文件"
            }],
            listeners: {
                change: function(g, h) {
                    var i;
                    switch (h) {
                        case 0:
                            i = "应用";
                            break;
                        case 1:
                            i = "模块";
                            break;
                        case 2:
                            i = Wb.getInfo(c);
                            break;
                        case 3:
                            i = Ide.activeCard && Ide.activeCard.file ? Ide.activeCard.file : "(无效)"
                    }
                    Wb.setTitle(g.up("window"), i)
                }
            }
        }, {
            xtype: "fieldcontainer",
            hideEmptyLabel: false,
            layout: "hbox",
            defaults: {
                flex: 1
            },
            items: [{
                itemId: "whole",
                boxLabel: "完全匹配",
                xtype: "checkbox",
                saveKeyname: "sys.ide.find.whole"
            }, {
                itemId: "caseSensitive",
                boxLabel: "区分大小写",
                xtype: "checkbox",
                saveKeyname: "sys.ide.find.caseSensitive"
            }, {
                itemId: "regularExp",
                boxLabel: "正则表达式",
                xtype: "checkbox",
                saveKeyname: "sys.ide.find.regularExp",
                listeners: {
                    change: function(h, i) {
                        var g = Wb.getRefer(h.ownerCt);
                        g.whole.setDisabled(i);
                        g.caseSensitive.setDisabled(i)
                    }
                }
            }]
        }];
        if (e) {
            a.splice(1, 0, {
                xtype: "combo",
                fieldLabel: "替换为",
                itemId: "replace",
                pickKeyname: "sys.ide.find.replace",
                store: []
            })
        }
        var d = Wb.prompt({
            title: (e ? "替换" : "搜索") + " - 应用",
            iconCls: "search_icon",
            items: a,
            handler: function(g, i) {
                function h() {
                    var k, j, l;
                    if (g.regularExp && Ext.String.endsWith(g.search, "/i")) {
                        k = true;
                        j = g.search.slice(0, -2);
                        g.search = "(?i)" + j
                    } else {
                        j = g.search
                    }
                    switch (g.scope) {
                        case 0:
                            l = [Ide.webPath];
                            break;
                        case 1:
                            l = [Ide.modulePath];
                            break;
                        case 2:
                            l = [];
                            Wb.each(c, function(m) {
                                l.push(Ide.getPath(m))
                            });
                            break;
                        case 3:
                            l = [];
                            if (Ide.activeCard && Ide.activeCard.file) {
                                l.push(Ide.activeCard.path)
                            }
                            break
                    }
                    Ide.doCommit();
                    Ide.searchGrid.store.load({
                        params: Ext.apply({
                            isReplace: e,
                            pathList: Wb.encode(l)
                        }, g),
                        callback: function(n, m, q) {
                            if (q) {
                                if (q) {
                                    Ide.showSearch()
                                }
                                Ide.searchGrid.searched = !e;
                                i.close();
                                if (e) {
                                    var p, o;
                                    if (g.regularExp) {
                                        if (k) {
                                            o = new RegExp(j, "i")
                                        } else {
                                            o = new RegExp(j)
                                        }
                                    } else {
                                        o = (g.whole ? "\\b" : "") + Wb.quoteRegexp(g.search) + (g.whole ? "\\b" : "");
                                        if (g.caseSensitive) {
                                            o = new RegExp(o)
                                        } else {
                                            o = new RegExp(o, "i")
                                        }
                                    }
                                    Ide.stopRecNav = true;
                                    Ide.searchGrid.store.each(function(r) {
                                        p = Ide.fileTab.child("[path=" + r.data.path + "]");
                                        if (p) {
                                            p.lastModified = r.get("lastModified");
                                            Ide.replaceText(p, o, g.replace)
                                        }
                                    });
                                    Ide.stopRecNav = false
                                }
                            }
                        }
                    })
                }
                if (e) {
                    Wb.confirm("确定要替换已经保存的文本吗？<br>警告：替换后将不可撤消。", h)
                } else {
                    h()
                }
            }
        });
        if (f) {
            d.getComponent("search").setValue(f.split("\n")[0].substring(0, 500))
        }
    },
    replaceText: function(c, b, f) {
        function d(g) {
            var h = g.getSearchCursor(b);
            while (h.findNext()) {
                h.replace(f)
            }
            g.needRefresh = true
        }

        function a(g) {
            if (!g) {
                return
            }
            Wb.each(g, function(h, i) {
                g[h] = i.replace(b, f)
            })
        }
        if (c.cardType == "module") {
            c.tree.getRootNode().cascadeBy(function(g) {
                if (!g.isRoot()) {
                    a(g.data.configs);
                    a(g.data.events);
                    if (g.data.text !== g.data.configs.itemId) {
                        g.set("text", g.data.configs.itemId);
                        g.commit();
                        Ide.syncNodes(g)
                    }
                }
            });
            Ide.refreshGrid(c.property);
            var e = c.getActiveTab();
            if (e.layoutCard) {
                Ide.updateLayout(e)
            }
        }
        if (c.editor) {
            d(c.editor)
        }
        if (c instanceof Ext.tab.Panel) {
            c.items.each(function(g) {
                if (g.editor) {
                    d(g.editor)
                }
            })
        }
    },
    refreshGrid: function(a) {
        if (!a) {
            a = Ide.activeCard.property
        }
        var g, h, e, d, b, c = ["text", "html", "js", "ss", "sql"],
            f = a.node,
            i = Ide.getMetaControl(f).data;
        a.store.stopUpdate = true;
        Ext.suspendLayouts();
        a.store.each(function(j) {
            g = j.data;
            b = g.type.toLowerCase();
            e = f.data[b];
            if (e) {
                h = e[g.name];
                d = i[b];
                if (d) {
                    d = d[g.name]
                }
                if (d && Wb.indexOf(c, d.type) != -1) {
                    h = Wb.toLine(h, 200)
                }
                j.set("value", h || "")
            }
        });
        a.store.commitChanges();
        Ext.resumeLayouts(true);
        a.store.stopUpdate = false
    },
    doCommit: function() {
        Ide.fileTab.items.each(function(a) {
            if (a.commitChange) {
                a.commitChange()
            }
        })
    },
    nodeItemIdValidator: function(c) {
        var b = false,
            a = Ide.activeCard.property.node;
        a.parentNode.eachChild(function(d) {
            if (d != a && d.data.text === c) {
                b = true;
                return false
            }
        });
        if (b) {
            return '名称 "' + c + '" 重复'
        } else {
            return true
        }
    },
    compItemIdValidator: function(d) {
        var c = false,
            a = this.ownerCt.curPropComp,
            b = a.ownerCt;
        b.items.each(function(e) {
            if (e != a && e._itemId === d) {
                c = true;
                return false
            }
        });
        if (c) {
            return '名称 "' + d + '" 重复'
        } else {
            return true
        }
    },
    setSQL: function() {
        Wb.run({
            url: "builder?xwl=sys/tool/dev/sql-builder",
            single: true,
            success: function(a) {
                a.getSQL(function(b) {
                    Ide.insertText(b)
                })
            }
        })
    },
    promptFrameDialog: function(e, b, d, c) {
        var a = [{
            fieldLabel: "名称",
            allowBlank: false,
            itemId: "name",
            validator: Ide.verifyName
        }, {
            fieldLabel: "标题",
            itemId: "title"
        }, app.getIconEditor(), Ide.getGlyphEditor()];
        if (d) {
            a = a.concat(d)
        }
        Wb.prompt({
            title: e,
            width: 585,
            iconCls: "file_add_icon",
            defaults: {
                labelWidth: 80
            },
            items: a,
            handler: function(f, h) {
                if (f.glyph) {
                    f.iconCls = f.glyph;
                    delete f.glyph
                }
                var g = app.getCurrentFolder(true);
                f.path = app.getPath(g);
                f.frameType = b;
                Wb.request({
                    url: "builder?xwl=dev/ide/add-frame",
                    params: f,
                    success: function(l) {
                        var k, i, j = g.data.loaded;
                        g.expand(false, function() {
                            if (j) {
                                k = g.appendChild({
                                    id: Wb.getId(),
                                    text: f.name + ".xwl",
                                    title: f.title,
                                    iconCls: f.iconCls,
                                    leaf: true
                                });
                                k.commit();
                                if (c) {
                                    i = g.appendChild({
                                        id: Wb.getId(),
                                        text: f.name,
                                        title: f.title,
                                        hidden: true,
                                        cls: "x-highlight"
                                    });
                                    i.commit()
                                }
                            } else {
                                k = g.findChild("text", f.name + ".xwl");
                                if (c) {
                                    i = g.findChild("text", f.name)
                                }
                            }
                            app.fileTree.setSelection(c ? [k, i] : k);
                            h.close()
                        })
                    }
                })
            }
        })
    },
    createCRUDFrame: function() {
        app.promptFrameDialog("添加增删改查框架模块", "crud", [{
            fieldLabel: "表名",
            itemId: "tableName",
            allowBlank: false
        }, {
            fieldLabel: "主键字段",
            itemId: "keyField",
            allowBlank: false
        }, {
            fieldLabel: "名称字段",
            itemId: "nameField"
        }, {
            fieldLabel: "编号字段",
            itemId: "codeField"
        }, {
            title: "数据的编辑方式",
            xtype: "fieldset",
            defaultType: "radio",
            items: [{
                boxLabel: "对话框",
                name: "editMode",
                checked: true,
                itemId: "dialog"
            }, {
                boxLabel: "可编辑表格",
                name: "editMode",
                itemId: "editGrid",
                listeners: {
                    change: function(a, b) {
                        a.up("window").getComponent("hasUpload").setDisabled(b)
                    }
                }
            }]
        }, {
            boxLabel: "包含文件上传控件",
            xtype: "checkbox",
            itemId: "hasUpload"
        }], true)
    },
    createDialogFrame: function() {
        app.promptFrameDialog("添加公共对话框框架模块", "xcommonDialog")
    },
    createMainFrame: function() {
        app.promptFrameDialog("添加主页面框架模块", "xmainPage")
    },
    getCurrentFolder: function(a) {
        var b = app.fileTree.getSelection()[0];
        if (!b) {
            b = app.fileTree.getRootNode().firstChild
        }
        if (b.isLeaf()) {
            b = b.parentNode
        }
        return a ? b : app.getPath(b)
    },
    setPaper: function() {
        var a = Ide.getDesigner();
        if (!a) {
            Wb.warn("请打开布局设计器使用该功能。");
            return
        }
        Wb.prompt({
            title: "设置纸张大小",
            iconCls: "report_icon",
            focusControl: "width",
            items: [{
                fieldLabel: "纸张类型",
                xtype: "combo",
                allowBlank: false,
                editable: false,
                value: 0,
                store: [
                    [
                        [210, 297], "A4纵向"
                    ],
                    [
                        [297, 210], "A4横向"
                    ],
                    [
                        [297, 420], "A3纵向"
                    ],
                    [
                        [420, 297], "A3横向"
                    ],
                    [0, "自定义大小"]
                ],
                listeners: {
                    change: function(c, e) {
                        var d = c.ownerCt.down("#width"),
                            b = c.ownerCt.down("#height");
                        if (e) {
                            d.setValue(e[0]);
                            b.setValue(e[1])
                        } else {
                            Wb.reset([b, d])
                        }
                    }
                }
            }, {
                fieldLabel: "宽度(mm)",
                xtype: "numberfield",
                allowBlank: false,
                decimalPrecision: 0,
                itemId: "width",
                value: 210,
                minValue: 0
            }, {
                fieldLabel: "长度(mm)",
                xtype: "numberfield",
                allowBlank: false,
                decimalPrecision: 0,
                itemId: "height",
                value: 297,
                minValue: 0
            }],
            handler: function(b, c) {
                a.setWidth(4 * b.width);
                a.setHeight(4 * b.height);
                Ide.setModified();
                c.close()
            }
        })
    },
    adjustZIndex: function() {
        Wb.confirm("确定要自动调整当前控件所属所有子控件的先后顺序吗？", function() {
            Ide.doAdjustZIndex()
        })
    },
    doAdjustZIndex: function(a) {
        var b, d = [],
            c = Ide.getDesigner();
        if (a) {
            b = [a]
        } else {
            if (c) {
                Ide.doApplyLayout(c.ownerCt, true);
                b = [c.node]
            } else {
                b = Ide.getNode(true)
            }
        }
        if (Wb.isEmpty(b)) {
            Wb.warn("请在对象视图中选择至少1个容器节点。");
            return
        }
        Ext.suspendLayouts();
        Wb.each(b, function(e) {
            e.eachChild(function(f) {
                d.push({
                    node: f,
                    w: (parseInt(f.data.configs.y, 10) || 0) * 1000000 + (parseInt(f.data.configs.x, 10) || 0)
                });
                Ide.doAdjustZIndex(f)
            });
            if (e.data.configs.layout == "absolute") {
                Ext.Array.sort(d, function(g, f) {
                    return g.w - f.w
                });
                Wb.each(d, function(f) {
                    e.appendChild(f.node)
                });
                Ide.activeCard.items.each(function(f) {
                    var g = f.designer;
                    if (g && g.node == e) {
                        Wb.each(d, function(h) {
                            g.items.each(function(i) {
                                if (i.isMask && i.bindComp.node == h.node) {
                                    g.add(i.bindComp);
                                    g.add(i)
                                }
                            })
                        })
                    }
                })
            }
        });
        Ext.resumeLayouts(true);
        Ide.setModified()
    },
    setLayout: function() {
        var b = Ide.activeCard,
            d, c, e;
        d = Ide.getNode();
        if (!d) {
            Wb.warn("请在模块对象视图中选择1个容器节点。");
            return
        }
        if (!Ide.getMetaControl(d).data.configs.layout) {
            Wb.warn("所选择的节点无任何可用布局。");
            return
        }
        c = d.data.configs.layout;

        function a() {
            if (!c) {
                d.data.configs.layout = "absolute";
                Ide.setModified()
            }
            b.items.each(function(f) {
                if (f.layoutCard && f.node == d) {
                    e = f;
                    return false
                }
            });
            if (!e) {
                e = b.add({
                    title: d.data.text,
                    iconCls: d.data.iconCls,
                    node: d,
                    layoutCard: true,
                    closable: true,
                    autoScroll: true,
                    border: false,
                    commitChange: Ide.applyLayout,
                    bodyStyle: "background-color:#787878",
                    bbar: [{
                        xtype: "tbtext",
                        text: "名称:"
                    }, {
                        itemId: "itemId",
                        xtype: "textfield",
                        allowBlank: false,
                        width: 130,
                        validator: Ide.compItemIdValidator,
                        listeners: {
                            change: function(g, h) {
                                if (g.ownerCt.allowChange && g.isValid()) {
                                    var f = g.ownerCt.curPropComp;
                                    f._itemId = h;
                                    Ide.updateLabel(f);
                                    f.node.set("text", h);
                                    f.node.commit();
                                    Ide.syncNodes(f.node);
                                    Ide.setModified()
                                }
                            }
                        }
                    }, {
                        xtype: "tbtext",
                        text: "标签:"
                    }, {
                        itemId: "text",
                        xtype: "textfield",
                        width: 130,
                        listeners: {
                            change: function(g, h) {
                                var f = g.ownerCt.curPropComp;
                                if (g.ownerCt.allowChange && g.isValid() && f.handleText) {
                                    f[Wb.valuePart(f.handleText)](h);
                                    Ide.updateLabel(f);
                                    if (f.header && !f.isXWin) {
                                        f.header.setVisible(f.title)
                                    }
                                    Ide.setModified()
                                }
                            }
                        }
                    }, {
                        xtype: "tbtext",
                        text: "左:"
                    }, {
                        itemId: "x",
                        method: "setLocalX",
                        xtype: "numberfield",
                        allowDecimals: false,
                        step: 8,
                        width: 70,
                        listeners: {
                            change: Ide.setCompPos
                        }
                    }, {
                        xtype: "tbtext",
                        text: "上:"
                    }, {
                        itemId: "y",
                        method: "setLocalY",
                        xtype: "numberfield",
                        allowDecimals: false,
                        step: 8,
                        width: 70,
                        listeners: {
                            change: Ide.setCompPos
                        }
                    }, {
                        xtype: "tbtext",
                        text: "宽:"
                    }, {
                        itemId: "width",
                        method: "setWidth",
                        xtype: "numberfield",
                        allowDecimals: false,
                        minValue: 0,
                        step: 8,
                        width: 70,
                        listeners: {
                            change: Ide.setCompPos
                        }
                    }, {
                        xtype: "tbtext",
                        text: "高:"
                    }, {
                        itemId: "height",
                        method: "setHeight",
                        xtype: "numberfield",
                        allowDecimals: false,
                        minValue: 0,
                        step: 8,
                        width: 70,
                        listeners: {
                            change: Ide.setCompPos
                        }
                    }],
                    tabConfig: {
                        tooltip: Ide.getNodePath(d)
                    },
                    listeners: {
                        activate: Ide.updateLayout,
                        beforedeactivate: Ide.applyLayout,
                        afterrender: {
                            single: true,
                            fn: function(f) {
                                f.comps = {
                                    toolbar: f.down("toolbar")
                                };
                                Wb.getRefer(f.comps.toolbar, f.comps)
                            }
                        }
                    }
                })
            }
            b.setActiveTab(e)
        }
        if (!c) {
            Wb.confirm("容器未设置为absolute布局，点击确定将设置。", a)
        } else {
            if (c == "absolute" || Ext.String.startsWith(c, "@") && Wb.decode(c.substring(1)).type == "absolute") {
                a()
            } else {
                Wb.warn("该布局可在对象视图中直接进行编辑。")
            }
        }
    },
    setCompPos: function(b, c) {
        if (b.ownerCt.allowChange && b.isValid()) {
            var a = b.ownerCt.curPropComp;
            a[b.method](c);
            if (a.bindMask) {
                app.fitComp(a)
            }
            Ide.setModified()
        }
    },
    applyLayout: function() {
        Ide.doApplyLayout(this, true)
    },
    doApplyLayout: function(b, a) {
        var c = b.designer;

        function d(i, h) {
            var e, j = i.node,
                k = j.data.configs,
                g = Ide.getMetaControl(j).data,
                f = g.general,
                l = g.configs;
            if (!h) {
                if (l.x) {
                    k.x = i.getLocalX().toString()
                }
                if (l.y) {
                    k.y = i.getLocalY().toString()
                }
            }
            if (f.width) {
                k.width = i.getWidth().toString()
            }
            if (f.height) {
                k.height = i.getHeight().toString()
            }
            k.itemId = i._itemId;
            if ((i instanceof Ext.form.field.Base || i instanceof Ext.form.Label) && !(i instanceof Ext.form.field.Hidden)) {
                if (i.labelAlign == "left") {
                    k.labelAlign = ""
                } else {
                    k.labelAlign = i.labelAlign
                }
            }
            if (i.handleText) {
                e = Wb.namePart(i.handleText);
                if (i[e]) {
                    k[e] = i[e]
                } else {
                    delete k[e]
                }
            }
            if (j.data.text !== k.itemId) {
                j.set("text", k.itemId);
                j.commit()
            }
        }
        d(c, true);
        c.items.each(function(e) {
            if (!e.isMask) {
                d(e)
            }
        });
        if (a) {
            Ide.refreshGrid(b.ownerCt.property)
        }
    },
    updateLayout: function(b) {
        var d, a = b.designer,
            c = b.node;
        Ext.suspendLayouts();
        try {
            Ide.render(b, c, true);
            a = b.designer;
            c.eachChild(function(e) {
                Ide.render(a, e)
            });
            a.items.each(function(e) {
                d = e.node;
                if (d && d.parentNode != c) {
                    a.remove(e);
                    a.remove(e.bindMask)
                }
            });
            Ide.loadProps(a, true)
        } finally {
            Ext.resumeLayouts(true)
        }
    },
    findCompFromNode: function(b, c) {
        var a = null;
        b.items.each(function(d) {
            if (d.node == c) {
                a = d;
                return false
            }
        });
        return a
    },
    setConfigs: function(a, c, b) {
        var d;
        Wb.each(b.configs, function(e, f) {
            if (f.method) {
                d = c[e];
                if (d) {
                    if (f.type == "exp") {
                        d = parseInt(d, 10)
                    } else {
                        if (f.type == "expBool") {
                            d = d == "true"
                        } else {
                            if (f.type == "glyph") {
                                d = parseInt(d, 16)
                            }
                        }
                    }
                } else {
                    d = f.defaultValue
                }
                if (!Wb.equals(a[e], d)) {
                    a[f.method](d)
                }
            }
        })
    },
    loadConfigs: function(a, c, b) {
        var d;
        Wb.each(b.configs, function(e, f) {
            if (f.method && c[e]) {
                d = c[e];
                if (d) {
                    if (f.type == "exp") {
                        d = parseInt(d, 10)
                    } else {
                        if (f.type == "expBool") {
                            d = d == "true"
                        }
                    }
                }
                a[e] = d
            }
        })
    },
    valueToString: function(b) {
        var a = {};
        Wb.each(b, function(d, c) {
            if (Ext.isString(c)) {
                a[d] = c
            } else {
                a[d] = Wb.encode(c)
            }
        });
        return a
    },
    createColumns: function() {
        var d = app.getNode(),
            c, j, g, h, a, i, f, e, b;
        if (!d || d.data.type != "grid") {
            Wb.warn("请选择1个表格控件。");
            return
        }
        if (d.findChild("text", "columns")) {
            Wb.warn("该表格的列已经存在。");
            return
        }
        b = Wb.parseBool(d.data.configs.editable);
        h = d.data.configs.store;
        if (h) {
            h = h.substring(4);
            c = d.getOwnerTree().getRootNode().firstChild
        } else {
            h = "store";
            c = d
        }
        j = c.findChild("text", h);
        a = j ? j.data.configs.url : null;
        if (!a) {
            Wb.warn("未设置表格关联store的url属性。");
            return
        }
        Wb.promptText("设置参数 - 自动生成列模型", function(k, m) {
            if (k == "(无)") {
                k = null
            }
            if (k) {
                try {
                    f = Wb.decode(k)
                } catch (l) {
                    Wb.error("参数无效，参数应该为有效的JSON格式。");
                    return
                }
            }
            Wb.request({
                url: a,
                params: f,
                success: function(r) {
                    var n, o, p;
                    try {
                        n = Wb.decode(r.responseText)
                    } catch (q) {
                        Wb.error("表格数据源无效或参数错误。");
                        return
                    }
                    o = n.columns;
                    p = {
                        text: "columns",
                        type: "array",
                        iconCls: "ja_icon",
                        expanded: true,
                        children: [],
                        configs: {
                            itemId: "columns"
                        }
                    };
                    if (!o) {
                        if (Ext.isArray(n) && n.length) {
                            e = n[0]
                        } else {
                            if (n.rows && n.rows.length) {
                                e = n.rows[0]
                            }
                        }
                        if (e) {
                            o = [];
                            Wb.each(e, function(s) {
                                o.push({
                                    dataIndex: s
                                })
                            })
                        }
                    }
                    Wb.each(o, function(s) {
                        if (s.hidden) {
                            return
                        }
                        i = (s.dataIndex || s.xtype || "empty") + "Col";
                        var t = {
                            text: i,
                            type: "column",
                            iconCls: "column_icon",
                            children: [],
                            configs: app.valueToString(Ext.copyTo({
                                itemId: i
                            }, s, "align,autoWrap,dataIndex,keyName,showInMenu,text,width,xtype"))
                        };
                        if (b && s.editor && s.category != "blob") {
                            g = app.controlDefines[s.editor.xtype];
                            if (g) {
                                t.expanded = true;
                                t.children.push({
                                    text: "editor",
                                    type: g.type,
                                    iconCls: g.iconCls,
                                    children: [],
                                    configs: app.valueToString(Ext.copyTo({
                                        itemId: "editor"
                                    }, s.editor, "maxValue,minValue,maxLength,allowBlank,keyName,readOnly,decimalPrecision,height"))
                                })
                            }
                        }
                        p.children.push(t)
                    });
                    Wb.append(p, d);
                    Ide.lastCreateColParams = k;
                    app.setModified();
                    m.close()
                }
            })
        }, {
            iconCls: "column_icon",
            value: Ide.lastCreateColParams || "(无)"
        })
    },
    createEditors: function() {
        Wb.run({
            url: "module-selector",
            single: true,
            success: function(a) {
                a.win.addDocked({
                    xtype: "toolbar",
                    itemId: "paramBar",
                    dock: "top",
                    items: ["参数：", {
                        xtype: "textfield",
                        itemId: "paramText",
                        value: Ide.lastCreateColParams || "(无)",
                        flex: 1
                    }]
                });
                a.hideHandler = function() {
                    delete a.hideHandler;
                    a.win.removeDocked(a.win.down("#paramBar"))
                };
                a.show(function(c, f) {
                    var g, b = f.down("#paramText").getValue();
                    if (b == "(无)") {
                        b = null
                    }
                    if (b) {
                        try {
                            g = Wb.decode(b)
                        } catch (d) {
                            Wb.error("参数无效，参数应该为有效的JSON格式。");
                            return
                        }
                    }
                    Wb.request({
                        url: c,
                        params: g,
                        success: function(s) {
                            var h, j, A, l, i, v, r, q, m, w = 0,
                                t = 240,
                                o = 0,
                                n = 0,
                                k = app.anchorRightBtn.pressed,
                                p = [],
                                u = app.getNode();
                            try {
                                l = Wb.decode(s.responseText)
                            } catch (z) {
                                Wb.error("选择的模块不是有效的数据源或参数错误。");
                                return
                            }
                            i = l.columns;
                            if (!i) {
                                if (Ext.isArray(l) && l.length) {
                                    h = l[0]
                                } else {
                                    if (l.rows && l.rows.length) {
                                        h = l.rows[0]
                                    }
                                }
                                if (h) {
                                    i = [];
                                    Wb.each(h, function(e) {
                                        i.push({
                                            dataIndex: e
                                        })
                                    })
                                }
                            }
                            v = u.data.configs.layout == "absolute";
                            if (v) {
                                r = parseInt(u.data.configs.width / 264, 10) || 1;
                                if (r == 1 && u.data.configs.width) {
                                    t = Ext.Number.snap(u.data.configs.width - 48, 8)
                                }
                            }
                            Wb.each(i, function(e) {
                                if (e.hidden) {
                                    return
                                }
                                if (e.editor || e.blobEditor) {
                                    if (e.blobEditor) {
                                        j = app.controlDefines.blob
                                    } else {
                                        j = app.controlDefines[e.editor.xtype]
                                    }
                                    if (j) {
                                        A = Ext.copyTo({
                                            itemId: e.dataIndex
                                        }, e.editor || e.blobEditor, "maxValue,minValue,maxLength,allowBlank,keyName,readOnly,decimalPrecision,height");
                                        A.fieldLabel = e.text;
                                        if (k) {
                                            A.labelAlign = "right"
                                        }
                                        if (v) {
                                            if (o % r === 0) {
                                                o = 0;
                                                n++;
                                                if (m) {
                                                    w += 136;
                                                    m = false
                                                }
                                            }
                                            o++;
                                            if (e.editor && e.editor.xtype == "textarea") {
                                                m = true;
                                                q = 160
                                            } else {
                                                q = 22
                                            }
                                            Wb.apply(A, {
                                                x: 16 + (o - 1) * 264,
                                                y: 16 + (n - 1) * 40 + w,
                                                width: t,
                                                height: q
                                            })
                                        }
                                        p.push({
                                            text: e.dataIndex,
                                            type: j.type,
                                            iconCls: j.iconCls,
                                            children: [],
                                            configs: app.valueToString(A)
                                        })
                                    }
                                }
                            });
                            u.expand();
                            Wb.append(p, u);
                            app.lastCreateColParams = b;
                            app.setModified();
                            f.close()
                        }
                    })
                }, "设置数据源和参数 - 自动添加编辑控件")
            }
        })
    },
    render: function(c, b, h) {
        var g = {},
            d, i, e, k, j = Ide.getMetaControl(b).data,
            a = j.general,
            f = b.data.configs;
        if (a.width) {
            e = parseInt(a.width, 10)
        } else {
            e = 100
        }
        if (a.height) {
            k = parseInt(a.height, 10)
        } else {
            k = Wb.getDefaultHeight()
        }
        d = Ide.findCompFromNode(c, b);
        if (!h) {
            Wb.each(["x", "y"], function(l) {
                if (f[l]) {
                    g[l] = parseInt(f[l], 10)
                }
            });
            if (g.x === undefined) {
                g.x = 8
            }
            if (g.y === undefined) {
                g.y = 8
            }
        }
        Wb.each(["width", "height"], function(l) {
            if (f[l]) {
                g[l] = parseInt(f[l], 10)
            }
        });
        if (g.width === undefined) {
            g.width = h ? 480 : e
        }
        if (g.height === undefined) {
            g.height = h ? 320 : k
        }
        if (g.width === 0) {
            g.width = 100
        }
        if (g.height === 0) {
            g.height = Wb.getDefaultHeight()
        }
        Ext.copyTo(g, f, ["icon", "iconCls", "labelAlign", "text", "fieldLabel", "title"]);
        if (d) {
            Ext.suspendLayouts();
            try {
                d._itemId = f.itemId;
                Ide.setConfigs(d, f, j);
                if (d.setIcon && !Wb.equals(d.icon, g.icon)) {
                    d.setIcon(g.icon)
                }
                if (d.setIconCls && !Wb.equals(d.iconCls, g.iconCls)) {
                    d.setIconCls(g.iconCls)
                }
                if (!Wb.equals(d.labelAlign, g.labelAlign)) {
                    Ide.setLabelAlign(d, g.labelAlign)
                }
                if (d.setText && !Wb.equals(d.text, g.text)) {
                    d.setText(g.text)
                }
                if (d.setTitle && !Wb.equals(d.title, g.title)) {
                    d.setTitle(g.title)
                }
                if (d.setFieldLabel && !Wb.equals(d.fieldLabel, g.fieldLabel)) {
                    d.setFieldLabel(g.fieldLabel)
                }
                if (d.header && d.header.hidden !== Wb.isEmpty(g.title) && a.xtype != "window") {
                    d.header.setVisible(d.header.hidden)
                }
                if (!h) {
                    if (d.setLocalX && d.getLocalX() !== g.x) {
                        d.setLocalX(g.x);
                        d.bindMask.setLocalX(g.x)
                    }
                    if (d.setLocalY && d.getLocalY() !== g.y) {
                        d.setLocalY(g.y);
                        d.bindMask.setLocalY(g.y)
                    }
                }
                if (d.setWidth && d.getWidth() !== g.width) {
                    d.setWidth(g.width);
                    if (!h) {
                        d.bindMask.setWidth(g.width)
                    }
                }
                if (d.setHeight && d.getHeight() !== g.height) {
                    d.setHeight(g.height);
                    if (!h) {
                        d.bindMask.setHeight(g.height);
                        d.bindMask.el.setStyle("line-height", (g.height - 3) + "px")
                    }
                }
                if (d.bindMask) {
                    Ide.updateLabel(d)
                }
                if (h) {
                    if (a.xtype == "window") {
                        d.down("toolbar").setVisible(f.dialog == "true" || f.editWin == "true" || f.buttons)
                    }
                    i = f.autoScroll === "true";
                    if (d.autoScroll !== i) {
                        d.setAutoScroll(i)
                    }
                }
            } finally {
                Ext.resumeLayouts(true)
            }
        } else {
            g._itemId = f.itemId;
            g.handleText = a.handleText;
            Ide.loadConfigs(g, f, j);
            if (h) {
                g.xtype = "panel";
                g.header = {
                    height: Wb.isNeptune ? 36 : 23,
                    style: "padding: 4px 5px 4px 5px;"
                };
                if (a.xtype != "window" && !g.title) {
                    g.header.hidden = true
                }
                if (f.autoScroll === "true") {
                    g.autoScroll = true
                }
                g.cls = "wb_design";
                g.bodyStyle = "background-color:white;background-image:url(images/app/dot.png);";
                if (Ext.String.startsWith(f.layout, "@")) {
                    g.layout = Wb.decode(f.layout.substring(1))
                } else {
                    g.layout = f.layout
                }
                g.plugins = {
                    ptype: "wbselector"
                };
                g.resizable = {
                    handles: "s e se",
                    pinned: true,
                    widthIncrement: 8,
                    heightIncrement: 8,
                    listeners: {
                        resize: function() {
                            var l = this;
                            Ide.loadProps(l.target, true);
                            Ide.setModified()
                        }
                    }
                };
                g.listeners = {
                    afterrender: {
                        single: true,
                        fn: function(l) {
                            Ide.loadProps(l);
                            l.mon(l.body, {
                                scope: l.body,
                                scroll: function() {
                                    var n = this,
                                        m = n.dom.scrollLeft,
                                        o = n.dom.scrollTop;
                                    n.setStyle("background-position", (-m % 8) + "px " + (-o % 8) + "px")
                                }
                            });
                            l.mon(l.el, {
                                scope: l,
                                mousedown: function(n) {
                                    var m = this;
                                    if (Wb.fromPanel(m, n)) {
                                        Ide.selectAll(m, false);
                                        Ide.loadProps(m)
                                    }
                                    m.ownerCt.focus();
                                    if (Wb.getSelText()) {
                                        Wb.clearSelText()
                                    }
                                }
                            });
                            new Ext.dd.DropTarget(l.body.dom, {
                                ddGroup: "controlList",
                                notifyDrop: function(o, n, m) {
                                    Ide.addDesignComp(l, m.records[0], n.getX() + l.body.dom.scrollLeft - l.body.getLeft(), n.getY() + l.body.dom.scrollTop - l.body.getTop())
                                }
                            })
                        }
                    }
                }
            } else {
                g.listeners = {
                    focus: function(l) {
                        if (l.blur) {
                            l.blur()
                        }
                    }
                };
                if ((a.xtype == "checkbox" || a.xtype == "radio") && !g.boxLabel) {
                    g.boxLabel = " ";
                    g.listeners.afterrender = {
                        single: true,
                        fn: function(l) {
                            l.setBoxLabel("")
                        }
                    }
                }
            }
            g.tabIndex = -1;
            if (!g.xtype) {
                g.xtype = a.xtype
            }
            g.node = b;
            if (a.designXtype) {
                g.xtype = a.designXtype
            } else {
                if (!g.xtype || a.design === false) {
                    g.xtype = "component";
                    g.style = "background:white;border:1px solid #bbb;";
                    g.width = e;
                    g.height = k
                }
            }
            if (a.xtype == "window") {
                Ext.apply(g, {
                    isXWin: true,
                    buttons: {
                        height: 37,
                        hidden: f.dialog != "true" && f.editWin != "true" && !f.buttons,
                        items: [{
                            text: Str.ok,
                            buttonStyle: "primary",
                            glyph: 61452,
                            itemId: "okButton"
                        }, {
                            text: Str.cancel,
                            buttonStyle: "default",
                            glyph: 61453,
                            itemId: "cancelButton"
                        }]
                    }
                })
            }
            d = c.add(g);
            if (h) {
                d.ownerCt.designer = d
            } else {
                Ide.addMask(c, d)
            }
        }
    },
    addDesignComp: function(c, f, a, g) {
        var e, d, b = f.data.general;
        e = {
            node: c.node,
            x: Ext.Number.snap(a, 8),
            y: Ext.Number.snap(g, 8),
            width: b.width || 100
        };
        if (b.height) {
            e.height = b.height
        }
        d = Ide.addControl(f, false, e);
        Ide.doApplyLayout(c.ownerCt);
        Ide.updateLayout(c.ownerCt);
        Ide.selectAll(c, false, Ide.findCompFromNode(c, d).bindMask)
    },
    addMask: function(b, a) {
        b.add({
            xtype: "box",
            isMask: true,
            style: (a instanceof Ext.form.field.Base || a instanceof Ext.form.FieldContainer || a instanceof Ext.Img || a instanceof Ext.form.Label || a.xtype == "component" || a.xtype == "container") ? "border:1px dotted #bbb;" : "",
            cls: "x-unselectable ide_mask",
            html: "<span></span>",
            draggable: {
                listeners: {
                    drag: Ide.dragComp,
                    mousedown: Ide.dragMousedown
                }
            },
            listeners: {
                afterrender: {
                    single: true,
                    fn: function(c) {
                        c.label = c.el.down("span");
                        c.card = b;
                        c.bindComp = a;
                        a.bindMask = c;
                        Ide.updateLabel(a);
                        Ide.fitComp(a, c);
                        c.mon(c.el, {
                            scope: c,
                            dblclick: function(h, f) {
                                var g = this.bindComp.node,
                                    d = this.card.ownerCt.ownerCt;
                                d.setActiveTab(d.designCard);
                                g.getOwnerTree().selectPath(g.getPath("text"), "text")
                            },
                            mousedown: function(g, d) {
                                if (Ide.isResizer(g.target)) {
                                    return
                                }
                                var f = this;
                                if (g.shiftKey) {
                                    Ide.doSelect(f, !f.isSelected)
                                } else {
                                    if (!f.isSelected) {
                                        Ide.selectAll(f.card, false, f)
                                    }
                                }
                                Ide.loadProps(f.card)
                            }
                        })
                    }
                }
            }
        })
    },
    isResizer: function(a) {
        return Ext.fly(a).hasCls("x-resizable-handle")
    },
    fitResizer: function(b) {
        var a = b.target;
        Wb.setBox(a, a.bindComp);
        a.el.setStyle("line-height", (a.getHeight() - 3) + "px");
        Ide.loadProps(a.ownerCt, true);
        Ide.setModified()
    },
    fitComp: function(b) {
        var a = b.bindMask;
        if (Wb.setBox(b, a)) {
            a.el.setStyle("line-height", (b.getHeight() - 3) + "px")
        }
    },
    dragComp: function(e) {
        var b, a = e.comp,
            f = e.lastXY,
            d = Ext.Number.snap(f[0] - e.startXY[0], 8),
            c = Ext.Number.snap(f[1] - e.startXY[1], 8);
        Ext.suspendLayouts();
        a.card.items.each(function(g) {
            if (g.isSelected) {
                g.setLocalXY(g.originXY[0] + d, g.originXY[1] + c);
                b = g.bindComp;
                b.setLocalXY(b.originXY[0] + d, b.originXY[1] + c)
            }
        });
        Ide.loadProps(a.card, true);
        Ext.resumeLayouts(true);
        Ide.setModified()
    },
    dragMousedown: function(b, c) {
        if (Ide.isResizer(c.target)) {
            return false
        }
        var a = b.comp;
        if (!a.isSelected) {
            return false
        }
        b.startXY = b.lastXY;
        a.card.items.each(function(d) {
            d.originXY = d.getLocalXY()
        })
    },
    doSelect: function(c, d) {
        if (c.isSelected === d) {
            return
        }
        c.isSelected = d;
        if (c.resizer) {
            var b, e = c.resizer,
                a = e.possiblePositions;
            Ext.suspendLayouts();
            Wb.each(a, function(f, g) {
                b = e[g];
                if (d) {
                    b.show()
                } else {
                    b.hide()
                }
            });
            Ext.resumeLayouts(true)
        } else {
            if (d) {
                c.initResizable({
                    handles: "all",
                    pinned: true,
                    widthIncrement: 8,
                    heightIncrement: 8,
                    listeners: {
                        resize: Ide.fitResizer
                    }
                })
            }
        }
    },
    loadProps: function(b, i) {
        if (!b.rendered) {
            return
        }
        var e, g, d, a, f = 0,
            c = b.ownerCt.comps,
            h = c.toolbar;
        b.items.each(function(j) {
            if (j.isMask && j.isSelected) {
                f++;
                if (!e) {
                    e = j.bindComp
                }
            }
        });
        if (f === 0) {
            e = b
        }
        if (f > 1) {
            a = f
        } else {
            a = e
        }
        if (!i && h.curPropComp === a) {
            return
        }
        h.curPropComp = a;
        Ext.suspendLayouts();
        try {
            h.allowChange = false;
            h.items.each(function(j) {
                j.setDisabled(f > 1)
            });
            if (f > 1) {
                Wb.setValue(h, {
                    itemId: f + " 项",
                    text: "",
                    x: "",
                    y: "",
                    width: "",
                    height: ""
                })
            } else {
                g = e.handleText;
                d = !Wb.getBool(g);
                if (c.text.disabled != d) {
                    c.text.setDisabled(d)
                }
                if (c.x.disabled != (f === 0)) {
                    c.x.setDisabled(f === 0)
                }
                if (c.y.disabled != (f === 0)) {
                    c.y.setDisabled(f === 0)
                }
                Wb.setValue(h, {
                    itemId: e._itemId,
                    text: g ? e[Wb.namePart(g)] : "",
                    x: e.getLocalX(),
                    y: e.getLocalY(),
                    width: e.getWidth(),
                    height: e.getHeight()
                })
            }
        } finally {
            Ext.resumeLayouts(true);
            h.allowChange = true
        }
    },
    updateLabel: function(a) {
        if (!a.bindMask) {
            return
        }
        var c = a._itemId;
        if (a.handleText) {
            var b = a[Wb.namePart(a.handleText)];
            if (b) {
                c = ""
            }
        }
        if (a.bindMask.label.innerLabel !== c) {
            a.bindMask.label.innerLabel = c;
            a.bindMask.label.update(c)
        }
    },
    selectAll: function(a, b, c) {
        Ext.suspendLayouts();
        a.items.each(function(d) {
            if (d.isMask) {
                if (d == c) {
                    Ide.doSelect(d, true)
                } else {
                    Ide.doSelect(d, b)
                }
            }
        });
        Ide.loadProps(a);
        Ext.resumeLayouts(true)
    },
    syncNodes: function(b) {
        var a, d, c = Ide.activeCard;
        if (!Ext.isArray(b)) {
            b = [b]
        }
        c.items.each(function(e) {
            Wb.each(b, function(f) {
                a = e.node;
                if (a == f || a && a.isAncestor(f)) {
                    d = Ide.getNodePath(a);
                    e.tab.setTooltip(d);
                    if (e.layoutCard) {
                        e.setTitle(a.data.text)
                    } else {
                        e.setTitle(a.data.text + "." + e.itemName);
                        e.funcBtn.setText(d)
                    }
                    return false
                }
            })
        })
    },
    syncBindRef: function(e, b) {
        var f, c, d = Ide.activeCard,
            a = d.tree;
        e = "app." + e;
        b = "app." + b;
        a.getRootNode().cascadeBy(function(g) {
            if (g.getDepth() > 0) {
                f = Ide.getMetaControl(g).data.configs;
                c = g.data.configs;
                Wb.each(c, function(h, i) {
                    if (f[h] && f[h].type == "expBind" && i == e) {
                        c[h] = b
                    }
                })
            }
        })
    },
    gotoLine: function() {
        var a = Ide.getEditor();
        if (a) {
            Wb.prompt({
                title: "跳转到行",
                items: {
                    fieldLabel: "行号",
                    xtype: "numberfield",
                    allowDecimals: false,
                    itemId: "line",
                    saveKeyname: "sys.ide.gotoLine",
                    minValue: 1
                },
                handler: function(c, e) {
                    c.line--;
                    a.setCursor({
                        line: c.line,
                        ch: 0
                    });
                    var b = a.getScrollInfo().clientHeight,
                        d = a.charCoords({
                            line: c.line,
                            ch: 0
                        }, "local");
                    a.scrollTo(null, (d.top + d.bottom - b) / 2);
                    e.close();
                    a.focus()
                }
            })
        } else {
            Wb.warn("当前不在编辑状态。")
        }
    },
    recordActivity: function() {
        if (Ide.stopRecNav) {
            return
        }
        var b = Ide.activeCard,
            c, e, d = {
                card: b.id
            };
        if (!b) {
            return
        }
        if (b.cardType == "module") {
            c = b.getActiveTab();
            if (!c) {
                return
            }
            editor = c.editor;
            d.subCard = c.id
        } else {
            editor = b.editor
        }
        if (editor) {
            var a = editor.getScrollInfo();
            d.cursor = editor.getCursor();
            d.left = a.left;
            d.top = a.top
        }
        e = Ide.backList[Ide.backList.length - 1];
        if (!e || e.card != d.card || e.subCard != d.subCard || (editor && ((Math.abs(d.cursor.ch - e.cursor.ch) > 200) || (Math.abs(d.cursor.line - e.cursor.line) > 20)))) {
            if (Ide.backList.length > 49) {
                Ide.backList.splice(0, 1)
            }
            Ide.backList.push(d)
        } else {
            if (editor) {
                e.cursor = d.cursor;
                e.left = d.left;
                e.top = d.top
            }
        }
    },
    navigate: function(c) {
        var a, b;
        a = Ext.getCmp(c.card);
        if (a) {
            Ide.fileTab.setActiveTab(a)
        } else {
            return false
        }
        if (c.subCard) {
            b = Ext.getCmp(c.subCard);
            if (b) {
                a.setActiveTab(b);
                if (c.cursor) {
                    b.editor.scrollTo(c.left, c.top);
                    b.editor.setCursor(c.cursor);
                    b.editor.focus()
                }
            } else {
                return false
            }
        } else {
            if (c.cursor) {
                a.editor.scrollTo(c.left, c.top);
                a.editor.setCursor(c.cursor);
                a.editor.focus()
            }
        }
        return true
    },
    back: function() {
        if (Ide.backList.length < 2) {
            return
        }
        var a = Ide.backList.pop();
        if (a) {
            if (Ide.forwardList.length > 49) {
                Ide.forwardList.splice(0, 1)
            }
            Ide.forwardList.push(a)
        } else {
            return
        }
        Ide.stopRecNav = true;
        while (Ide.backList.length > 0 && !Ide.navigate(Ide.backList[Ide.backList.length - 1])) {
            Ide.backList.pop()
        }
        Ide.stopRecNav = false
    },
    forward: function() {
        var a;
        Ide.stopRecNav = true;
        while ((a = Ide.forwardList.pop())) {
            if (Ide.navigate(a)) {
                break
            }
        }
        Ide.stopRecNav = false;
        if (a) {
            if (Ide.backList.length > 49) {
                Ide.backList.splice(0, 1)
            }
            Ide.backList.push(a)
        }
    },
    setActiveComp: function(d, c) {
        if (Ide.fileTree.el.isAncestor(c)) {
            Ide.activeCmp = "file";
            if (Wb.getSelText()) {
                Wb.clearSelText()
            }
        } else {
            if (Ide.fileTab.el.isAncestor(c)) {
                if (Wb.getSelText() && Wb.hasNS("activeCard.tree.el.isAncestor", Ide) && Ide.activeCard.tree.el.isAncestor(c)) {
                    Wb.clearSelText()
                }
                var b, a = Ide.activeCard;
                if (a && a.designCard) {
                    b = a.getActiveTab();
                    if (b == a.designCard || b.layoutCard) {
                        Ide.activeCmp = "control"
                    } else {
                        Ide.activeCmp = "file"
                    }
                } else {
                    Ide.activeCmp = "file"
                }
            }
        }
    },
    addEvents: function() {
        var a = Ext.getDoc();
        a.on("click", app.setActiveComp);
        a.on("contextmenu", app.setActiveComp);
        new Ext.KeyNav({
            target: a,
            ignoreInputFields: true,
            beforeCall: function(b) {
                if (Wb.getSelText() || Wb.isModal()) {
                    return false
                }
                if (b.ctrlKey && b.getKey() == b.A && !Ide.getDesigner()) {
                    return false
                }
            },
            del: Ide.remove,
            A: {
                ctrl: true,
                fn: Ide.doSelectAll
            },
            C: {
                ctrl: true,
                fn: Ide.copy
            },
            X: {
                ctrl: true,
                fn: function(b) {
                    if (b.shiftKey) {
                        Ide.remove()
                    } else {
                        Ide.cut()
                    }
                }
            },
            V: {
                ctrl: true,
                fn: Ide.paste
            },
            left: Ide.adjustPosSize,
            up: Ide.adjustPosSize,
            right: Ide.adjustPosSize,
            down: Ide.adjustPosSize
        });
        new Ext.KeyNav({
            target: a,
            beforeCall: function(c) {
                var b = c.getKey();
                if (Wb.isModal() && !(b == c.K && c.ctrlKey && c.shiftKey)) {
                    c.stopEvent();
                    return false
                }
            },
            Q: {
                ctrl: true,
                fn: Ide.run
            },
            O: {
                ctrl: true,
                fn: Ide.open
            },
            S: {
                ctrl: true,
                fn: function(b) {
                    Ide.saveFile(b.shiftKey)
                }
            },
            L: {
                ctrl: true,
                shift: true,
                fn: Ide.searchFile
            },
            J: {
                ctrl: true,
                fn: function(b) {
                    Ide.doAdd(b.shiftKey)
                }
            },
            K: {
                ctrl: true,
                shift: true,
                fn: function() {
                    Ide.fillForm()
                }
            },
            U: {
                ctrl: true,
                fn: function(b) {
                    if (b.shiftKey) {
                        Ide.adjustZIndex()
                    } else {
                        Ide.setProperty()
                    }
                }
            },
            H: {
                ctrl: true,
                fn: function(b) {
                    if (b.shiftKey) {
                        Ide.searchAgain()
                    } else {
                        Ide.search()
                    }
                }
            },
            B: {
                ctrl: true,
                fn: function(b) {
                    if (b.shiftKey) {
                        Ide.setSQL()
                    } else {
                        Ide.setLayout()
                    }
                }
            },
            I: {
                ctrl: true,
                fn: function(b) {
                    if (b.shiftKey) {
                        Ide.toggleViewBtn.toggle()
                    } else {
                        Ide.toggleOutputsBtn.toggle()
                    }
                }
            },
            "0": {
                ctrl: true,
                fn: Ide.forward
            },
            "1": {
                ctrl: true,
                fn: function(b) {
                    if (b.shiftKey) {
                        Ide.addAppTpl()
                    } else {
                        Ide.addFuncNote()
                    }
                }
            },
            "2": {
                ctrl: true,
                fn: Ide.addPropertyNote
            },
            "3": {
                ctrl: true,
                fn: Ide.addTodo
            },
            "4": {
                ctrl: true,
                fn: Ide.addWbRequest
            },
            "5": {
                ctrl: true,
                fn: Ide.gotoLine
            },
            "6": {
                ctrl: true,
                fn: Ide.toDesign
            },
            "7": {
                ctrl: true,
                fn: Ide.toggleRun
            },
            "8": {
                ctrl: true,
                fn: Ide.toggleEditor
            },
            "9": {
                ctrl: true,
                fn: Ide.back
            }
        })
    },
    getDesigner: function() {
        var a;
        if (Ide.activeCard && Ide.activeCard.cardType == "module") {
            a = Ide.activeCard.getActiveTab();
            if (a.layoutCard) {
                return a.designer
            }
        }
        return null
    },
    toDesign: function() {
        var a = Ide.activeCard;
        if (a && a.cardType == "module") {
            a.setActiveTab(a.designCard)
        }
    },
    adjustPosSize: function(c) {
        if (!c.ctrlKey && !c.shiftKey) {
            return
        }
        var a, f, d, b = Ide.getDesigner();
        if (!b) {
            return
        }
        b.items.each(function(e) {
            if (e.isSelected) {
                if (!d) {
                    d = true
                }
                a = e.bindComp;
                switch (c.getKey()) {
                    case 37:
                        if (c.shiftKey) {
                            e.setWidth(e.getWidth() - 1);
                            a.setWidth(a.getWidth() - 1)
                        } else {
                            f = e.getLocalX();
                            e.setLocalX(--f);
                            f = a.getLocalX();
                            a.setLocalX(--f)
                        }
                        break;
                    case 38:
                        if (c.shiftKey) {
                            e.setHeight(e.getHeight() - 1);
                            a.setHeight(a.getHeight() - 1)
                        } else {
                            f = e.getLocalY();
                            e.setLocalY(--f);
                            f = a.getLocalY();
                            a.setLocalY(--f)
                        }
                        break;
                    case 39:
                        if (c.shiftKey) {
                            e.setWidth(e.getWidth() + 1);
                            a.setWidth(a.getWidth() + 1)
                        } else {
                            f = e.getLocalX();
                            e.setLocalX(++f);
                            f = a.getLocalX();
                            a.setLocalX(++f)
                        }
                        break;
                    case 40:
                        if (c.shiftKey) {
                            e.setHeight(e.getHeight() + 1);
                            a.setHeight(a.getHeight() + 1)
                        } else {
                            f = e.getLocalY();
                            e.setLocalY(++f);
                            f = a.getLocalY();
                            a.setLocalY(++f)
                        }
                        break
                }
            }
        });
        if (d) {
            Ide.loadProps(b, true);
            Ide.setModified()
        }
    },
    setOldPath: function(a) {
        Wb.each(a, function(b) {
            b.data.oldPath = Ide.getPath(b)
        })
    },
    getXwlData: function(c) {
        var f, e, a = c.tree,
            b = a.getRootNode(),
            d = Ext.copyTo({}, b.data, ["title", "hidden", "inframe", "pageLink", "iconCls"]);
        if (c.commitChange) {
            c.commitChange()
        }
        e = Ide.getChildrenData(b, d);
        f = d.children[0].configs.loadJS;
        if (!e && f && (f.indexOf("touch") != -1 || f.indexOf("bootstrap") != -1)) {
            e = true
        }
        if (e) {
            d.inframe = true;
            b.set("inframe", true);
            b.commit()
        }
        return Wb.encode(d)
    },
    setModified: function(a) {
        if (!a) {
            a = Ide.activeCard
        }
        if (!a.isModified) {
            Wb.setModified(a);
            Ide.setButtons()
        }
    },
    defineClasses: function() {
        Ext.define("Wb.ide.DragSelector", {
            requires: ["Ext.dd.DragTracker", "Ext.util.Region"],
            alias: "plugin.wbselector",
            init: function(a) {
                this.panel = a;
                a.mon(a, {
                    beforecontainerclick: this.cancelClick,
                    scope: this,
                    render: {
                        fn: this.onRender,
                        scope: this,
                        single: true
                    }
                })
            },
            onRender: function() {
                this.tracker = new Ext.dd.DragTracker({
                    panel: this.panel,
                    el: this.panel.body,
                    dragSelector: this,
                    onBeforeStart: this.onBeforeStart,
                    onStart: this.onStart,
                    onDrag: this.onDrag,
                    onEnd: this.onEnd
                });
                this.dragRegion = new Ext.util.Region()
            },
            onBeforeStart: function(a) {
                return Wb.fromPanel(this.panel, a)
            },
            onStart: function(a) {
                var b = this.dragSelector;
                this.dragging = true;
                b.fillRegions();
                b.getProxy().show()
            },
            cancelClick: function() {
                return !this.tracker.dragging
            },
            onDrag: function(i) {
                var b = this.dragSelector,
                    n = b.dragRegion,
                    m = b.bodyRegion,
                    k = b.getProxy(),
                    j = this.startXY,
                    p = this.getXY(),
                    f = Math.min(j[0], p[0]),
                    c = Math.min(j[1], p[1]),
                    a = Math.abs(j[0] - p[0]),
                    o = Math.abs(j[1] - p[1]),
                    l, g;
                Ext.apply(n, {
                    top: c,
                    left: f,
                    right: f + a,
                    bottom: c + o
                });
                n.constrainTo(m);
                k.setRegion(n);
                var d = null,
                    h = 0;
                this.panel.items.each(function(e) {
                    if (e.isMask) {
                        l = e.el.getRegion();
                        g = n.intersect(l);
                        Ide.doSelect(e, g);
                        if (g) {
                            d = e;
                            h++
                        }
                    }
                });
                Ide.loadProps(this.panel)
            },
            onEnd: Ext.Function.createDelayed(function(a) {
                var b = this.dragSelector;
                this.dragging = false;
                b.getProxy().hide()
            }, 1),
            getProxy: function() {
                if (!this.proxy) {
                    this.proxy = this.panel.body.createChild({
                        tag: "div",
                        cls: "x-view-selector"
                    })
                }
                return this.proxy
            },
            fillRegions: function() {
                var a = this.panel;
                this.bodyRegion = a.body.getRegion()
            }
        })
    },
    autoRename: function(a, c, e) {
        var h = {},
            g = [],
            b, f = 0,
            d = 0;
        a.eachChild(function(i) {
            if (Wb.indexOf(c, i) == -1) {
                h[i.data.text] = true
            }
        });
        Wb.each(c, function(k) {
            var j = k.data.text,
                i = Wb.uniqueName(h, j);
            if (j != i) {
                if (!b) {
                    b = j
                }
                f++
            }
            h[i] = true;
            g.push(i)
        });
        if (f) {
            if (e) {
                e.wait = true;
                Wb.confirm((f > 1 ? ('"' + b + '" 等 ' + f + " 项") : ('"' + b + '" ')) + "名称重复，确定对拖动的重名节点重命名吗？", [function() {
                    e.processDrop()
                }, function() {
                    e.cancelDrop()
                }])
            } else {
                Ext.suspendLayouts();
                Wb.each(c, function(i) {
                    i.data.configs.itemId = g[d];
                    i.set("text", g[d]);
                    i.commit();
                    d++
                });
                Ext.resumeLayouts(true)
            }
        }
    },
    getChildrenData: function(e, f) {
        var c, b, g, h = false,
            a, d = ["configs", "events"];
        f.children = [];
        e.eachChild(function(i) {
            g = Ide.getMetaControl(i);
            if (!h && g.data.general.tag && (g.data.general.tag.lib == 2 || g.data.general.tag.lib == 3)) {
                h = true
            }
            c = {
                type: i.data.type,
                expanded: i.isExpanded()
            };
            f.children.push(c);
            Wb.each(d, function(j) {
                a = {};
                b = i.data[j];
                Wb.each(b, function(k, l) {
                    if (!Wb.isEmpty(l)) {
                        a[k] = l
                    }
                });
                if (!Ext.Object.isEmpty(a)) {
                    c[j] = a
                }
            });
            if (i.firstChild) {
                if (Ide.getChildrenData(i, c)) {
                    h = true
                }
            } else {
                c.children = []
            }
        });
        return h
    },
    lintScript: function(b) {
        var d = b.path,
            a = Wb.extractFileExt(d).toLowerCase();

        function c(e, f) {
            if (e.needLint) {
                e.startLinting(e)
            }
            if (!(f && f.sourceCard)) {
                Ide.clearMarkers(d, f);
                Ide.getMarkers(e, d, f)
            }
        }
        if (a == "js" || a == "ss" || a == "css") {
            c(b.editor)
        } else {
            if (a == "xwl") {
                b.items.each(function(e) {
                    if (e.editor && (e.fileExt == "js" || e.fileExt == "ss" || e.fileExt == "css")) {
                        c(e.editor, e)
                    }
                })
            }
        }
    },
    exportModules: function() {
        function b() {
            var e = this.up("window"),
                d, f = "",
                g = e.down("#dateRange").getValue();
            e.down("#modifyDate").setDisabled(g != 3);
            d = e.down("#fileRange").getValue() ? "全部" : "选择的";
            switch (g) {
                case 0:
                    f = "模块";
                    break;
                case 1:
                    f = "今天修改的模块";
                    break;
                case 2:
                    f = "从昨天到今天修改的模块";
                    break;
                case 3:
                    f = "从指定日期到今天修改的模块";
                    break
            }
            f = "导出" + d + f;
            e.down("#hintLabel").setValue(f)
        }

        function a() {
            var e, d = [];
            if (!c.down("#fileRange").getValue()) {
                e = Ide.fileTree.getSelection();
                Wb.each(e, function(f) {
                    d.push(Ide.getPath(f))
                })
            }
            return d
        }
        var c = Wb.prompt({
            title: "导出模块包",
            iconCls: "export_icon",
            items: [{
                xtype: "combo",
                itemId: "filename",
                fieldLabel: "文件名称",
                allowBlank: false,
                saveKeyname: "sys.ide.module.exportFileName",
                pickKeyname: "sys.ide.module.exportFileName",
                store: [],
                value: "app(" + Wb.format(new Date(), "Y-m-d") + ")"
            }, {
                xtype: "radiogroup",
                fieldLabel: "导出范围",
                itemId: "fileRange",
                saveKeyname: "sys.ide.module.fileRange",
                items: [{
                    boxLabel: "选择的文件或目录",
                    checked: true
                }, {
                    boxLabel: "全部文件或目录"
                }],
                listeners: {
                    change: b
                }
            }, {
                xtype: "radiogroup",
                fieldLabel: "修改日期",
                itemId: "dateRange",
                saveKeyname: "sys.ide.module.dateRange",
                items: [{
                    boxLabel: "不限",
                    checked: true
                }, {
                    boxLabel: "今天"
                }, {
                    boxLabel: "昨天"
                }, {
                    boxLabel: "指定"
                }, {
                    xtype: "datefield",
                    allowBlank: false,
                    itemId: "modifyDate",
                    disabled: true,
                    saveKeyname: "sys.ide.module.exportSpecifyDate",
                    width: 110
                }],
                listeners: {
                    change: b
                }
            }, {
                hideEmptyLabel: false,
                itemId: "hintLabel",
                xtype: "displayfield",
                value: "导出选择的模块"
            }],
            handler: function(d, f) {
                var e;
                switch (d.dateRange) {
                    case 0:
                        e = -1;
                        break;
                    case 1:
                        e = Ext.Date.clearTime(new Date());
                        break;
                    case 2:
                        e = Ext.Date.add(Ext.Date.clearTime(new Date()), Ext.Date.DAY, -1);
                        break;
                    case 3:
                        e = d.modifyDate;
                        break
                }
                Wb.download("builder?xwl=dev/ide/export-engine", {
                    filename: d.filename,
                    fileRange: a(),
                    lastModified: e
                });
                f.close()
            }
        })
    },
    importModules: function() {
        Wb.run({
            url: "upload-dialog",
            single: true,
            success: function(a) {
                a.upload({
                    url: "builder?xwl=dev/ide/import-engine",
                    iconCls: "import_icon",
                    title: "导入模块包",
                    success: function() {
                        Wb.reload(Ide.fileTree)
                    }
                });
                a.winWidth = a.win.getWidth();
                a.win.setWidth(500);
                a.form1.add({
                    xtype: "checkboxgroup",
                    itemId: "importOptionsGroup",
                    items: [{
                        boxLabel: "导入 URL 捷径",
                        itemId: "mergeUrl",
                        checked: !Ide.importUrlChecked,
                        listeners: {
                            change: function(b, c) {
                                Ide.importUrlChecked = !c
                            }
                        }
                    }, {
                        boxLabel: "覆盖模块权限",
                        itemId: "mergePerm",
                        checked: Ide.importPermChecked,
                        listeners: {
                            change: function(b, c) {
                                Ide.importPermChecked = c
                            }
                        }
                    }, {
                        boxLabel: "覆盖目录配置",
                        itemId: "mergeFolder",
                        checked: Ide.importFolderConfig,
                        listeners: {
                            change: function(b, c) {
                                Ide.importFolderConfig = c
                            }
                        }
                    }, {
                        boxLabel: "覆盖存在文件",
                        itemId: "overwritten",
                        checked: !Ide.importOverwritten,
                        listeners: {
                            change: function(b, c) {
                                Ide.importOverwritten = !c
                            }
                        }
                    }]
                });
                a.win.mon(a.win, {
                    hide: {
                        single: true,
                        fn: function(b) {
                            a.win.setWidth(a.winWidth);
                            a.form1.down("#importOptionsGroup").destroy()
                        }
                    }
                })
            }
        })
    },
    save: function() {
        Ide.saveFile()
    },
    saveAll: function() {
        Ide.saveFile(true)
    },
    saveFile: function(b, h, d) {
        if (b && Ide.saveAllBtn.disabled || !b && Ide.saveBtn.disabled) {
            Ext.callback(h);
            return
        }
        var f = [],
            e, a, g, c;
        Ide.fileTab.items.each(function(i) {
            if (i.isModified && (b || i == Ide.activeCard)) {
                c = Wb.extractFileExt(i.path).toLowerCase();
                if (c == "xwl") {
                    e = Ide.getXwlData(i)
                } else {
                    e = i.editor.getValue()
                }
                a = i.down("#funcBtn");
                if (c == "xwl") {
                    g = "utf-8"
                } else {
                    if (!a) {
                        g = null
                    } else {
                        g = a.text;
                        if (g == "default") {
                            g = null
                        }
                    }
                }
                f.push({
                    file: i.path,
                    lastModified: i.lastModified,
                    content: e,
                    charset: g
                })
            }
        });
        if (f.length === 0) {
            Ext.callback(h);
            return
        }
        Wb.request({
            url: "builder?xwl=dev/ide/save",
            jsonData: f,
            timeout: -1,
            params: {
                noConfirm: Wb.getBool(d, false)
            },
            showError: false,
            success: function(k) {
                var j = Wb.decode(k.responseText),
                    i = 0;
                Ide.fileTab.items.each(function(l) {
                    if (l.isModified && (b || l == Ide.activeCard)) {
                        Wb.unModified(l);
                        if (l.cardType != "module") {
                            l.editor.savedText = l.editor.getValue()
                        }
                        l.lastModified = Wb.strToDate(j[i]);
                        i++;
                        Ide.lintScript(l)
                    }
                });
                Ide.setButtons();
                Ext.callback(h)
            },
            failure: function(k) {
                var j = k.responseText,
                    i = Wb.getError(j, 101);
                if (i) {
                    Wb.confirm(i, function() {
                        Ide.saveFile(b, h, true)
                    })
                } else {
                    Wb.except(k)
                }
            }
        })
    },
    createScript: function(c, e) {
        var a = c.tree.getRootNode(),
            b, d = e.editor;
        b = "module=" + Ide.getNodeScript(a) + ";";
        b = js_beautify(b, {
            indent_size: 2
        });
        if (d.getValue() != b) {
            d.notRecordChange = true;
            d.setValue(b);
            delete d.notRecordChange;
            d.clearHistory()
        }
    },
    getNodeScript: function(c) {
        var b = [];

        function a(e, d, h) {
            var g, l, j, k, i, f = [];
            g = Ext.Object.getKeys(d);
            Ext.Array.sort(g);
            first = true;
            Wb.each(g, function(m) {
                l = e.data[h][m];
                if (l) {
                    i = l.type;
                    if (Ext.String.startsWith(i, "exp")) {
                        i = "exp"
                    }
                } else {
                    i = "string"
                }
                j = d[m];
                if (Wb.isEmpty(j)) {
                    return
                }
                switch (i) {
                    case "exp":
                        if (j.indexOf("{#") == -1 && !Ext.String.startsWith(j, "@")) {
                            k = j
                        } else {
                            k = Wb.encode(j)
                        }
                        break;
                    case "js":
                    case "ss":
                        k = "function(" + (l.params ? l.params.join(", ") : "") + "){\n" + j + "\n}";
                        break;
                    default:
                        k = Wb.encode(j)
                }
                f.push(m + ":" + k)
            });
            return f
        }
        c.eachChild(function(g) {
            var f, d = "",
                e = Ide.getMetaControl(g);
            f = a(e, g.data.configs, "configs");
            if (g.data.events) {
                d = a(e, g.data.events, "events");
                if (d.length) {
                    d = ",events:{" + d.join(",") + "}"
                }
            }
            if (g.hasChildNodes()) {
                f.push("items:[" + Ide.getNodeScript(g) + "]")
            }
            b.push("{" + f.join(",") + d + "}")
        });
        return b.join(",")
    },
    closeInnerTab: function(b) {
        var d, c = b.type,
            a = Ide.activeCard;
        if (a.cardType == "module") {
            d = a.getActiveTab();
            a.items.each(function(e) {
                if (e.closable && (c == 1 || e != d)) {
                    e.close()
                }
            })
        }
    },
    closeOthers: function() {
        Ide.doClose(Ide.activeCard)
    },
    closeAll: function() {
        Ide.doClose()
    },
    doClose: function(a) {
        Ext.suspendLayouts();
        Ide.fileTab.items.each(function(b) {
            if (b == a) {
                return
            }
            if (b.isModified) {
                Ide.fileTab.setActiveTab(b);
                Wb.choose('"' + b.file + '" 已经被修改，保存所做的更改吗？', function(c) {
                    if (c == "yes") {
                        Ide.saveFile(false, function() {
                            Ide.doClose(a)
                        })
                    } else {
                        if (c == "no") {
                            Wb.unModified(b);
                            Ide.doClose(a)
                        }
                    }
                });
                return false
            } else {
                b.close()
            }
        });
        Ext.resumeLayouts(true)
    },
    setCharset: function() {
        var a = Ide.activeCard,
            b = a.down("#funcBtn");
        Wb.prompt({
            title: "设置编码",
            items: {
                fieldLabel: "编码格式",
                itemId: "charset",
                xtype: "combo",
                value: b.text,
                allowBlank: false,
                store: ["default", "utf-8", "gbk"]
            },
            handler: function(c, d) {
                if (c.charset == b.text) {
                    d.close();
                    return
                }
                Wb.request({
                    url: "builder?xwl=dev/ide/open",
                    params: Ext.apply({
                        fileNames: Wb.encode([a.path])
                    }, c),
                    success: function(f) {
                        var e = Wb.decode(f.responseText)[0];
                        b.setText(c.charset);
                        a.lastModified = Wb.strToDate(e.lastModified);
                        a.editor.setValue(e.content);
                        d.close();
                        a.editor.focus()
                    }
                })
            }
        })
    },
    fileSelected: function() {
        var a = Ide.fileTree.getSelection()[0];
        return a && Wb.getNode(a, 1).data.type != "module"
    },
    verifyName: function(b) {
        var e, d, a = b.length;
        for (d = 0; d < a; d++) {
            e = b.charAt(d);
            if (!(e >= "a" && e <= "z" || e >= "A" && e <= "Z" || e == "_" || e == "-" || e == "." || e >= "0" && e <= "9")) {
                return Wb.format(Str.invalidChar, e)
            }
        }
        return true
    },
    refreshThread: function() {
        var a = new Date();
        Wb.request({
            url: "builder?xwl=dev/ide/get-thread-list",
            success: function(b) {
                Ide.threadCard.update(b.responseText)
            }
        })
    },
    refreshConnection: function() {
        var a = new Date();
        Wb.request({
            url: "builder?xwl=dev/ide/get-conn-list",
            success: function(b) {
                Ide.connCard.update(b.responseText)
            }
        })
    },
    getIconEditor: function() {
        return {
            fieldLabel: "图标",
            itemId: "iconCls",
            xtype: "combobox",
            fieldCls: "x_comboicon",
            anyMatch: true,
            store: Ide.iconData,
            typeAhead: true,
            displayField: "field1",
            valueField: "field1",
            tpl: ['<div><tpl for=".">', '<div class="x-boundlist-item wb_thumb" data-qtip="{field1}"><div class="wb_icon1 {field1}"></div></div>', "</tpl></div>"],
            listeners: {
                afterrender: {
                    single: true,
                    fn: function(a) {
                        if (a.value) {
                            a.setFieldCls(a.value)
                        }
                    }
                },
                change: function(a, c) {
                    if (a.priorCls) {
                        a.inputEl.removeCls(a.priorCls)
                    }
                    a.inputEl.addCls(c);
                    a.priorCls = c;
                    var b = a.ownerCt.getComponent("glyph");
                    if (c && b) {
                        b.setValue("")
                    }
                }
            }
        }
    },
    getGlyphValue: function() {
        return Wb.getBracketText(this.getComponent("glyphSuffix").getValue())
    },
    setGlyphValue: function(c) {
        var a, b = this.getComponent("glyphSuffix");
        if (c) {
            a = Wb.find(app.glyphClasses, 0, c)
        }
        b.setValue(a ? (c + " (" + a[1] + ")") : c)
    },
    getGlyphEditor: function() {
        return {
            fieldLabel: "文字图标",
            itemId: "glyph",
            xtype: "fieldcontainer",
            layout: "hbox",
            getValue: app.getGlyphValue,
            setValue: app.setGlyphValue,
            items: [{
                itemId: "glyphPrefix",
                xtype: "label",
                cls: "wb_glyph wb_glyphfont x_fly_item"
            }, {
                itemId: "glyphSuffix",
                flex: 1,
                xtype: "combo",
                fieldCls: "ide_glyphcombo",
                typeAhead: true,
                store: Ide.glyphClasses,
                anyMatch: true,
                queryFilter: new Ext.util.Filter({
                    filterFn: function(c) {
                        var a = this.value.toLowerCase(),
                            d = c.data.field1.toLowerCase(),
                            b = c.data.field2.toLowerCase();
                        return d.indexOf(a) != -1 || b.indexOf(a) != -1
                    }
                }),
                listeners: {
                    select: function(b, a) {
                        var c = a[0];
                        this.setValue(c.data.field1 + " (" + c.data.field2 + ")")
                    },
                    change: function(d, e) {
                        var c, a = this.previousSibling(),
                            b = Wb.getBracketText(e);
                        if (Ext.isNumeric("0x" + b)) {
                            a.setText("&#x" + b + ";", false)
                        } else {
                            a.setText("")
                        }
                        var f = d.ownerCt.ownerCt.getComponent("iconCls");
                        if (e && f) {
                            f.setValue("")
                        }
                    },
                    blur: function(b) {
                        var a = Wb.find(app.glyphClasses, 1, b.getValue());
                        if (a) {
                            b.setValue(a[0] + " (" + a[1] + ")")
                        }
                    }
                },
                tpl: ['<div><tpl for=".">', '<div class="x-boundlist-item wb_thumb wb_glyph3 ide_glyph" data-qtip="{field1} ({field2})">', "{[String.fromCharCode(parseInt(values.field1,16))]}", "</div></tpl></div>"]
            }]
        }
    },
    setProperty: function() {
        var f = Ide.fileTree.getSelection()[0];
        if (!f) {
            Wb.warn("请选择1个文件。");
            return
        }
        var i, h, c, b, a = f.isLeaf(),
            e = Wb.apply({}, f.data),
            j = Ide.getPath(f),
            d = f.getDepth();
        b = Wb.getNode(f, 1);
        i = b.data.type == "module" && (!a || Ext.String.endsWith(e.text, ".xwl"));
        if (d == 1 || d == 2 && b.data.type == "file") {
            c = [{
                fieldLabel: "名称",
                itemId: "text",
                readOnly: true
            }]
        } else {
            c = [{
                fieldLabel: "名称",
                itemId: "text",
                allowBlank: false,
                validator: i ? Ide.verifyName : Wb.verifyFile
            }]
        }
        if (i) {
            if (d > 1) {
                c.push({
                    fieldLabel: "标题",
                    itemId: "title"
                }, Ide.getIconEditor(), Ide.getGlyphEditor());
                if (a) {
                    c.push({
                        fieldLabel: "链接配置",
                        itemId: "pageLink"
                    }, {
                        fieldLabel: "URL 捷径",
                        itemId: "url",
                        value: "正在查询中...",
                        readOnly: true
                    })
                }
            }
        }
        c.push({
            fieldLabel: "修改时间",
            readOnly: true,
            itemId: "lastModified",
            value: "正在查询中..."
        });
        if (a) {
            c.push({
                fieldLabel: "大小",
                readOnly: true,
                itemId: "fileSize",
                value: "正在查询中..."
            })
        } else {
            if (Ide.isChild(j, Ide.webPath)) {
                c.push({
                    fieldLabel: "统计信息",
                    readOnly: true,
                    itemId: "total",
                    value: "正在统计中..."
                })
            }
        }
        if (i) {
            if (a) {
                c.push({
                    fieldLabel: "URL 地址",
                    readOnly: true,
                    value: Ide.getNodeUrl(f)
                })
            }
        }
        c.push({
            fieldLabel: "完全路径",
            readOnly: true,
            value: j
        });
        if (i) {
            if (a) {
                c.push({
                    xtype: "container",
                    layout: "hbox",
                    margin: "5 0 0 85",
                    defaults: {
                        flex: 1
                    },
                    items: [{
                        itemId: "hidden",
                        boxLabel: "在模块列表中隐藏",
                        xtype: "checkbox"
                    }, {
                        itemId: "inframe",
                        boxLabel: "在独立框架中运行",
                        xtype: "checkbox"
                    }]
                })
            } else {
                c.push({
                    boxLabel: "在模块列表中隐藏",
                    fieldLabel: "&nbsp;",
                    labelSeparator: "",
                    itemId: "hidden",
                    xtype: "checkbox"
                })
            }
        }
        Ide.activeCmp = "file";
        h = Wb.prompt({
            title: (a ? "文件" : "目录") + "属性 - " + e.text,
            width: 585,
            iconCls: "property_icon",
            focusControl: null,
            items: c,
            handler: function(k) {
                if (k.glyph) {
                    k.iconCls = k.glyph;
                    delete k.glyph
                }
                try {
                    if (k.pageLink) {
                        Wb.decode(k.pageLink)
                    }
                } catch (m) {
                    Wb.warn("链接配置项无效。", function() {
                        h.down("#pageLink").focus(false, true)
                    });
                    return
                }
                var l = h.down("#url");
                Wb.request({
                    url: "builder?xwl=dev/ide/set-property",
                    timeout: -1,
                    params: Ext.apply({
                        isModule: i,
                        path: Ide.getPath(f),
                        urlValid: l ? !l.readOnly : false
                    }, k),
                    success: function(p) {
                        var n, o = Wb.decode(p.responseText);
                        h.close();
                        if (a && Wb.extractFileExt(e.text) != Wb.extractFileExt(k.text)) {
                            k.icon = "builder?xwl=dev/ide/get-file-icon&file=" + encodeURIComponent(o.path);
                            k.iconCls = ""
                        }
                        k.cls = k.hidden ? "x-highlight" : "";
                        f.data.oldPath = Ide.getPath(f);
                        k = Ext.copyTo({}, k, ["text", "title", "hidden", "inframe", "pageLink", "icon", "iconCls", "cls"]);
                        Wb.update(f, k);
                        n = Ide.fileTab.child("[path=" + f.data.oldPath + "]");
                        if (n) {
                            n.lastModified = Wb.strToDate(o.lastModified)
                        }
                        Ide.syncFiles(f);
                        if (o.refactorInfo) {
                            Ide.syncData(o.refactorInfo)
                        }
                    }
                })
            }
        });
        if (Ext.isNumeric("0x" + e.iconCls)) {
            e.glyph = e.iconCls;
            e.iconCls = ""
        }
        Wb.setValue(h, e);
        var g = h.down("#text");
        g.focus(false, true, function() {
            var k = e.text.lastIndexOf(".");
            if (k == -1) {
                k = e.text.length
            }
            g.selectText(0, k)
        });
        Wb.request({
            url: "builder?xwl=dev/ide/total",
            params: {
                path: j
            },
            showMask: false,
            callback: function(k, r, l) {
                if (!Ext.getCmp(h.id)) {
                    return
                }
                if (r) {
                    var n, q = Wb.decode(l.responseText),
                        o = q.total;
                    Wb.setValue(h, {
                        lastModified: Wb.dateToText(q.lastModified),
                        url: q.url,
                        fileSize: Wb.getFileSize(q.fileSize) + " (" + q.fileSize + " B)"
                    });
                    var m = h.down("#url");
                    if (m) {
                        m.setReadOnly(false);
                        m.selectOnFocus = false;
                        m.validator = Ide.verifyName
                    }
                    if (o) {
                        for (n = 0; n < 3; n++) {
                            o[n] = Wb.format(o[n], "#,##0")
                        }
                        Wb.setValue(h, {
                            total: "模块数：" + o[0] + "，文件数：" + o[1] + "，目录数：" + o[2] + "，合计大小：" + Wb.getFileSize(o[3])
                        })
                    }
                } else {
                    var p = "查询失败";
                    Wb.setValue(h, {
                        url: p,
                        lastModified: p,
                        total: p,
                        fileSize: p
                    })
                }
            }
        })
    },
    getPathText: function(a) {
        if (Ide.isChild(a, Ide.modulePath)) {
            return a.substring(Ide.modulePath.length)
        } else {
            if (Ide.isChild(a, Ide.webPath)) {
                return a.substring(Ide.webPath.length)
            } else {
                return a
            }
        }
    },
    getRefPath: function(c, b, a) {
        return b + "/" + a.substring(c.length)
    },
    syncGrid: function(c, e, d, b) {
        var a;
        c.store.each(function(f) {
            if (Ide.isChild(f.data.path, e)) {
                if (b) {
                    a = d
                } else {
                    a = Ide.getRefPath(e, d, f.data.path)
                }
                f.set("path", a)
            }
        });
        c.store.commitChanges()
    },
    syncFiles: function(a) {
        if (!Ext.isArray(a)) {
            a = [a]
        }
        Ext.suspendLayouts();
        Wb.each(a, function(e) {
            var c, b = e.isLeaf(),
                f = e.data,
                g = f.oldPath + "/",
                d = Ide.getPath(e);
            delete f.oldPath;
            Ide.fileTab.items.each(function(i) {
                if (Ide.isChild(i.path, g) || i.runFile && Ide.isChild(i.runFile, g)) {
                    if (i.runFile) {
                        if (b) {
                            c = d
                        } else {
                            c = Ide.getRefPath(g, d, i.runFile)
                        }
                        i.runFile = c;
                        i.bindFile = Ide.getPathText(c);
                        if (b) {
                            i.setTitle(Ext.String.ellipsis(f.text, 20))
                        }
                    } else {
                        if (b) {
                            c = d
                        } else {
                            c = Ide.getRefPath(g, d, i.path)
                        }
                        i.path = c
                    }
                    i.tab.setTooltip(Ide.getPathText(c));
                    if (b && !i.runFile) {
                        if (i.tree) {
                            var h = i.tree.getRootNode();
                            h.data.title = f.title;
                            h.data.hidden = f.hidden;
                            h.data.inframe = f.inframe;
                            h.data.pageLink = f.pageLink;
                            h.data.iconCls = f.iconCls
                        }
                        i.setTitle((i.isModified ? "*" : "") + Ext.String.ellipsis(f.text, 20));
                        i.setIcon(f.icon);
                        i.setIconCls(f.iconCls);
                        i.file = f.text
                    }
                }
            });
            Ide.syncGrid(Ide.markerGrid, g, d, b);
            Ide.syncGrid(Ide.searchGrid, g, d, b)
        });
        Ext.resumeLayouts(true)
    },
    doAdd: function(a) {
        if (Ide.fileSelected()) {
            Ide.addFile(a)
        } else {
            Ide.addModule(a)
        }
    },
    add: function() {
        Ide.doAdd()
    },
    addFolder: function() {
        Ide.doAdd(true)
    },
    addModule: function(c) {
        var a, b = Ide.fileTree.getSelection()[0];
        if (!b) {
            b = Ide.fileTree.getRootNode().firstChild
        }
        a = [{
            fieldLabel: "名称",
            itemId: "name",
            allowBlank: false,
            validator: Ide.verifyName
        }, {
            fieldLabel: "标题",
            itemId: "title"
        }, Ide.getIconEditor(), Ide.getGlyphEditor()];
        if (!c) {
            a.push({
                fieldLabel: "链接配置",
                itemId: "pageLink"
            }, {
                fieldLabel: "URL 捷径",
                itemId: "url",
                validator: Ide.verifyName
            })
        }
        a.push({
            xtype: "fieldcontainer",
            layout: "hbox",
            hideEmptyLabel: false,
            defaults: {
                flex: 1
            },
            items: [{
                itemId: "insert",
                boxLabel: "插入在选择节点上",
                xtype: "checkbox",
                disabled: b.getDepth() == 1
            }, {
                itemId: "hidden",
                boxLabel: "在模块列表中隐藏",
                xtype: "checkbox"
            }]
        });
        if (!c) {
            a[a.length - 1].items.push({
                itemId: "inframe",
                boxLabel: "在独立框架中运行",
                xtype: "checkbox"
            })
        }
        Wb.prompt({
            title: "添加",
            width: 585,
            iconCls: c ? "folder_add_icon" : "file_add_icon",
            items: a,
            handler: function(d, i) {
                if (d.glyph) {
                    d.iconCls = d.glyph;
                    delete d.glyph
                }
                try {
                    if (d.pageLink) {
                        Wb.decode(d.pageLink)
                    }
                } catch (h) {
                    Wb.warn("链接配置项无效。", function() {
                        i.down("#pageLink").focus(false, true)
                    });
                    return
                }
                var g, j, f;
                if (!d.insert && !b.isLeaf()) {
                    g = b;
                    f = "append"
                } else {
                    g = b.parentNode;
                    f = d.insert ? "before" : "after";
                    j = b.data.text
                }
                Wb.request({
                    url: "builder?xwl=dev/ide/add-module",
                    params: Ext.apply(d, {
                        isDir: c,
                        path: Ide.getPath(g),
                        type: f,
                        indexName: j
                    }),
                    success: function(o) {
                        var m, n, k = Wb.decode(o.responseText);
                        if (!c) {
                            k = k[0]
                        }
                        m = {
                            id: Wb.getId(),
                            text: k.file,
                            title: k.title,
                            iconCls: k.iconCls,
                            hidden: k.hidden,
                            inframe: k.inframe,
                            pageLink: k.pageLink
                        };
                        if (c) {
                            m.children = []
                        } else {
                            m.leaf = true
                        }
                        if (m.hidden) {
                            m.cls = "x-highlight"
                        }

                        function e() {
                            Ide.fileTree.setSelection(n);
                            i.close();
                            if (!c) {
                                Ide.fileTab.setActiveTab(Ide.openModule(k))
                            }
                        }
                        if (f == "append") {
                            var l = g.data.loaded;
                            g.expand(false, function() {
                                if (l) {
                                    n = g.appendChild(m);
                                    n.commit()
                                } else {
                                    n = g.findChild("text", m.text)
                                }
                                e()
                            })
                        } else {
                            if (f == "before") {
                                n = g.insertBefore(m, b);
                                n.commit()
                            } else {
                                if (f == "after") {
                                    n = Wb.insertAfter(m, b)[0]
                                }
                            }
                            e()
                        }
                    }
                })
            }
        })
    },
    addFile: function(a) {
        Wb.prompt({
            title: "添加",
            iconCls: a ? "folder_add_icon" : "file_add_icon",
            items: [{
                fieldLabel: "名称",
                itemId: "name",
                allowBlank: false,
                validator: Wb.verifyFile
            }],
            handler: function(b, d) {
                var c = Ide.fileTree.getSelection()[0];
                if (c.isLeaf()) {
                    c = c.parentNode
                }
                Wb.request({
                    url: "builder?xwl=dev/ide/add-file",
                    params: {
                        isDir: a,
                        path: Ide.getPath(c),
                        name: b.name
                    },
                    success: function(g) {
                        Ide.activeCmp = "file";
                        var f = c.data.loaded,
                            e = Wb.decode(g.responseText);
                        c.expand(false, function() {
                            if (f) {
                                Wb.append(e, c)
                            } else {
                                Ide.fileTree.setSelection(c.findChild("text", e.text))
                            }
                            d.close()
                        })
                    }
                })
            }
        })
    },
    removeComp: function() {
        var b, c = Ide.activeCard.getActiveTab().designer,
            a = [];
        c.items.each(function(d) {
            if (d.isSelected) {
                b = d.bindComp;
                c.remove(b);
                a.push(b.node);
                c.remove(d)
            }
        });
        if (a.length > 0) {
            Ide.activeCard.tree.setSelection(a);
            return true
        } else {
            return false
        }
    },
    removeNode: function() {
        var b, a = Ide.activeCard.tree.getSelection();
        Ide.activeCard.items.each(function(d) {
            var e = false,
                c = d.node;
            if (c) {
                Wb.each(a, function(f) {
                    if (c.isAncestor(f) || f == c) {
                        e = true;
                        return false
                    }
                });
                if (e) {
                    d.close()
                }
            }
        });
        if ((b = Ide.getModuleNode(a))) {
            b.remove();
            Ide.addControl(Ide.moduleNode, true);
            return true
        } else {
            Wb.remove(Ide.activeCard.tree);
            return a.length > 0
        }
    },
    remove: function() {
        if (Ide.activeCmp == "control") {
            Ext.suspendLayouts();
            try {
                if (Ide.activeCard.getActiveTab().layoutCard) {
                    if (Ide.removeComp()) {
                        Ide.removeNode();
                        Ide.loadProps(Ide.activeCard.getActiveTab().designer);
                        Ide.setModified()
                    }
                } else {
                    if (Ide.removeNode()) {
                        Ide.setModified()
                    }
                }
            } finally {
                Ext.resumeLayouts(true)
            }
        } else {
            Ide.removeFiles()
        }
    },
    getPath: function(a) {
        if (!a || a.isRoot()) {
            return ""
        }
        var c = Wb.getSection(a.getPath("text"), "/", 3),
            b = Wb.getNode(a, 1),
            d = b.data.base;
        if (!c) {
            d = d.slice(0, -1)
        }
        if (b == Ide.sysNode) {
            return d + c.replace("//", "/")
        } else {
            return d + c
        }
    },
    getNodeUrl: function(a) {
        if (a.isLeaf()) {
            return Ide.getFileUrl(Ide.getPath(a))
        } else {
            return null
        }
    },
    addSocket: function() {
        Ide.msgSocket = new Ext.data.Socket({
            name: "ide.console",
            url: "ide",
            listeners: {
                success: function(a, c) {
                    if (!c) {
                        return
                    }
                    var b, d;
                    b = Wb.decode(c);
                    d = b.msg;
                    if (b.encode) {
                        d = Wb.decode(d)
                    }
                    if (b.type) {
                        Cs[b.type](d)
                    } else {
                        Cs.log(d)
                    }
                },
                onclose: function() {
                    app.toggleOutputsBtn.toggle(false, true)
                },
                onopen: function() {
                    app.toggleOutputsBtn.toggle(true, true)
                }
            }
        })
    },
    getNodePath: function(a) {
        return Wb.getSection(a.getPath("text"), "/", a.getDepth() == 1 ? 2 : 3)
    },
    getFileUrl: function(b) {
        if (!b) {
            return null
        }
        var a = b.toLowerCase();
        if (Ide.isChild(b, Ide.modulePath) && Ext.String.endsWith(a, ".xwl")) {
            return "builder?xwl=" + b.substring(Ide.modulePath.length).slice(0, -4)
        } else {
            if (Ide.isChild(b, Ide.webPath)) {
                return b.substring(Ide.webPath.length)
            }
        }
        return null
    },
    getWebPath: function(a) {
        var b = Ide.getPath(a);
        if (Ide.isChild(b, Ide.modulePath)) {
            return b.substring(Ide.modulePath.length)
        } else {
            if (Ide.isChild(b, Ide.webPath)) {
                return b.substring(Ide.webPath.length)
            } else {
                return null
            }
        }
    },
    getEditor: function(c) {
        var a, b = Ide.activeCard;
        if (b) {
            if (b.editor) {
                return c ? b : b.editor
            } else {
                if (b instanceof Ext.tab.Panel) {
                    a = b.getActiveTab();
                    if (a.editor) {
                        return c ? a : a.editor
                    }
                }
            }
        }
        return null
    },
    syncData: function(e) {
        var b, a, d = e.files,
            c = e.change;
        a = c.length;
        Wb.each(c, function(f) {
            f[0] = new RegExp(f[0])
        });
        Wb.each(d, function(f) {
            card = Ide.fileTab.child("[path=" + f.path + "]");
            if (card) {
                card.lastModified = Wb.strToDate(f.lastModified);
                for (b = 0; b < a; b++) {
                    Ide.replaceText(card, c[b][0], c[b][1])
                }
            }
        })
    },
    doSelectAll: function() {
        var a = Ide.activeCard;
        if (a && a.cardType == "module") {
            a = a.getActiveTab();
            if (a.layoutCard) {
                Ide.selectAll(a.designer, true)
            }
        }
    },
    cutCopy: function(a) {
        if (Ide.activeCmp == "control") {
            Ide.copyNode(a)
        } else {
            Ide.copyFile(a)
        }
    },
    copy: function() {
        Ide.cutCopy(true)
    },
    cut: function() {
        Ide.cutCopy(false)
    },
    copyNode: function(b) {
        var e = Ide.activeCard.getActiveTab();
        if (e.layoutCard) {
            if (Ide.syncSelect()) {
                Ide.doApplyLayout(e)
            } else {
                return
            }
        }
        var a = Ide.activeCard.tree,
            d = a.getSelection(),
            c = [];
        if (!d.length) {
            return
        }
        Wb.each(d, function(f) {
            c.push(Wb.copy(f))
        });
        Ide.clipboardType = "node";
        Ide.clipboard = c;
        if (!b) {
            Ide.remove();
            Ide.setModified()
        }
    },
    copyFile: function(b) {
        var a = Ide.fileTree.getSelection();
        if (a.length) {
            Ide.isCopy = b;
            Ide.clipboardType = "file";
            Ide.clipboard = a
        }
    },
    paste: function() {
        var a = Ext.EventObject.shiftKey;
        if (Ide.activeCmp == "control") {
            if (Ide.clipboardType == "node") {
                Ide.pasteNode(a)
            }
        } else {
            if (Ide.clipboardType == "file") {
                Ide.pasteFile(false, a)
            }
        }
    },
    syncSelect: function() {
        var b = Ide.activeCard.getActiveTab().designer,
            a = [];
        b.items.each(function(c) {
            if (c.isSelected) {
                a.push(c.bindComp.node)
            }
        });
        if (a.length > 0) {
            Ide.activeCard.tree.setSelection(a);
            return true
        } else {
            return false
        }
    },
    getModuleNode: function(a) {
        var b = null;
        Wb.each(a, function(c) {
            if (c.type == "module" || c.data && c.data.type == "module") {
                b = c;
                return false
            }
        });
        return b
    },
    pasteNode: function(a) {
        var g, d, e = Ide.activeCard.getActiveTab();
        if (e.layoutCard) {
            Ide.doApplyLayout(e);
            g = e.designer.node;
            a = true
        } else {
            g = Ide.activeCard.tree.getSelection()[0]
        }
        if (!g) {
            Wb.warn("请选择1个节点。");
            return
        }
        Ide.setModified();
        d = Ide.getModuleNode(Ide.clipboard);
        if (d) {
            var i = Ide.activeCard.tree.getRootNode();
            Ext.suspendLayouts();
            Ide.activeCard.items.each(function(k) {
                if (k.closable) {
                    k.close()
                }
            });
            i.removeChild(i.firstChild);
            Wb.append(Ext.clone(d), i);
            Ext.resumeLayouts(true);
            return
        }
        if (g.getDepth() == 1) {
            a = true
        }
        var b, h, f = Ext.clone(Ide.clipboard),
            j = {};

        function c(k) {
            Wb.each(k, function(l) {
                l.id = Wb.getId();
                if (l.children) {
                    c(l.children)
                }
            })
        }
        c(f);
        if (a) {
            h = g
        } else {
            h = g.parentNode
        }
        h.eachChild(function(k) {
            j[k.data.text] = true
        });
        Wb.each(f, function(l) {
            var k = Wb.uniqueName(j, l.configs.itemId);
            l.configs.itemId = k;
            l.text = k;
            j[k] = true
        });
        if (a) {
            g.expand();
            b = Wb.append(f, g)
        } else {
            b = Wb.insertAfter(f, g)
        }
        if (e.layoutCard) {
            Ide.updateLayout(e);
            Ext.suspendLayouts();
            try {
                e.designer.items.each(function(k) {
                    if (k.isMask) {
                        Ide.doSelect(k, Wb.indexOf(b, k.bindComp.node) != -1)
                    }
                });
                Ide.loadProps(e.designer)
            } finally {
                Ext.resumeLayouts(true)
            }
        }
    },
    pasteFile: function(d, f) {
        var e = Ide.fileTree.getSelection()[0];
        if (!e) {
            Wb.warn("请选择1个文件或目录节点。");
            return
        }
        if (e.getDepth() == 1) {
            if (e.data.base === "") {
                Wb.warn("无法粘贴在此目录下。");
                return
            }
            f = true
        }
        var b = Ide.isCopy,
            c = Ext.Array.clone(Ide.clipboard),
            a = [],
            g = f && !e.isLeaf() ? "append" : "after";
        Wb.each(c, function(h) {
            a.push(Ide.getPath(h))
        });
        Wb.request({
            url: "builder?xwl=dev/ide/move",
            showError: false,
            timeout: -1,
            params: {
                isCopy: b,
                noConfirm: Wb.getBool(d, true),
                src: Wb.encode(a),
                dst: Ide.getPath(e),
                dropPosition: g,
                type: Wb.getNode(e, 1).data.type
            },
            success: function(o) {
                var m, s, r, q, p = 0,
                    v = true,
                    l, h = Wb.decode(o.responseText),
                    u = h.moveTo,
                    t = [];

                function n() {
                    var x, k = [],
                        j = Ide.fileTree.selModel,
                        w = 0;
                    j.deselectAll();
                    Wb.each(t, function() {
                        x = s.findChild("text", t[w][1]);
                        if (x.isLoaded() && t[w][2]) {
                            x.expand();
                            Ide.fileTree.store.load({
                                node: x
                            })
                        }
                        j.select(x, true);
                        if (!b) {
                            x.data.oldPath = t[w][0];
                            k.push(x)
                        }
                        w++
                    });
                    if (!b) {
                        Ide.syncFiles(k);
                        Ide.syncData(h)
                    }
                }
                q = u.length;
                for (r = 0; r < q; r++) {
                    t.push([Ide.getPath(c[p]), Wb.getFilename(u[r][0]), u[r][1]]);
                    if (!b) {
                        c[p].remove()
                    }
                    if (u[r][1]) {
                        c.splice(p, 1)
                    } else {
                        p++
                    }
                }
                if (g == "append") {
                    s = e;
                    if (e.isLoaded()) {
                        e.expand();
                        m = Wb.append(c, e, b)
                    } else {
                        v = false;
                        e.expand(false, n)
                    }
                } else {
                    s = e.parentNode;
                    m = Wb.insertAfter(c, e, b)
                }
                if (m) {
                    p = 0;
                    for (r = 0; r < q; r++) {
                        if (!u[r][1]) {
                            m[p].set("text", Wb.getFilename(u[r][0]));
                            m[p].commit();
                            p++
                        }
                    }
                }
                if (v) {
                    n()
                }
            },
            failure: function(j) {
                var i = j.responseText,
                    h = Wb.getError(i, 101);
                if (h) {
                    Wb.confirm(h, function() {
                        Ide.pasteFile(true, f)
                    })
                } else {
                    Wb.except(j)
                }
            }
        })
    },
    isChild: function(b, a) {
        return Ext.String.startsWith(b + "/", a)
    },
    insertText: function(b) {
        var a = Ide.getEditor();
        if (a && !a.options.readOnly) {
            a.replaceSelection(b);
            a.focus()
        }
    },
    addFuncNote: function() {
        Ide.addScript(["/**", " * 文档注释。", " *", " * Example:", " *", " *     var foo = bar();", " *", " * @param {type} name1 必须参数说明。", " * @param {type} [name2] 可选参数说明。", " * @return {type} 返回值说明。", " */"])
    },
    addPropertyNote: function() {
        Ide.addScript(["/** @property {type} name 参数说明 */"])
    },
    addTodo: function() {
        Ide.addScript(["// TODO: "])
    },
    addAppTpl: function() {
        Ide.addScript(["Wb.apply(app, {", "", "});"])
    },
    addWbRequest: function() {
        Ide.addScript(["Wb.request({", "  url: '',", "  params: {},", "  success: function(resp) {}", "});"])
    },
    addScript: function(a) {
        var c, b, e, d = Ide.getEditor();
        if (!d) {
            return
        }
        e = d.getCursor().ch;
        b = a.length;
        for (c = 1; c < b; c++) {
            a[c] = Ext.String.leftPad("", e) + a[c]
        }
        d.replaceSelection(a.join("\n"));
        d.focus()
    },
    clearBookmark: function() {
        var a = Ide.getEditor(true);
        if (!a) {
            return
        }
        Wb.remove(a.toolbar, a.toolbar.query("splitbutton"))
    },
    addBookmark: function() {
        var a = Ide.getEditor(true);
        if (!a) {
            return
        }
        Ide.doAddBookmark(a.editor)
    },
    doAddBookmark: function(a) {
        var e = a.getCursor(),
            b = Ext.htmlEncode(Ext.String.trim(a.getLine(e.line))),
            d = a.card.toolbar.query("splitbutton"),
            c = false;
        Wb.each(d, function(f) {
            var g = f.bookmark.find();
            if (g) {
                if (g.line == e.line) {
                    c = true;
                    return false
                }
            } else {
                a.card.toolbar.remove(f)
            }
        });
        if (c) {
            return
        }
        a.card.toolbar.insert(2, {
            text: Ext.String.ellipsis(b, 15) || "书签",
            bookmark: a.setBookmark(e),
            scrollInfo: a.getScrollInfo(),
            cursor: e,
            xtype: "splitbutton",
            minWidth: 50,
            handler: function(f) {
                var g = f.bookmark.find();
                if (g) {
                    if (g.line === e.line) {
                        a.scrollTo(f.scrollInfo.left, f.scrollInfo.top)
                    }
                    a.setCursor(g);
                    a.focus()
                } else {
                    a.card.toolbar.remove(f);
                    Wb.warn("该书签已经被删除。")
                }
            },
            menu: {
                xtype: "menu",
                items: [{
                    text: "删除书签",
                    handler: function(g) {
                        var f = g.up("splitbutton");
                        f.bookmark.clear();
                        a.card.toolbar.remove(f)
                    }
                }]
            }
        }).el.highlight()
    },
    removeFiles: function() {
        var a = Ide.fileTree.getSelection(),
            c = [],
            b;
        if (!a.length) {
            return
        }
        a = Wb.reverse(a);
        Wb.each(a, function(d) {
            Wb.highlight(d, true);
            if (d.getDepth() == 1) {
                b = d;
                return false
            }
            c.push(Ide.getPath(d))
        });
        if (b) {
            Wb.warn('不能删除 "' + b.data.text + '" 的所有文件。', null, Ide.fileTree.view.getNode(b));
            return
        }
        Wb.confirm(a.length === 1 ? '确定要删除 "' + a[0].data.text + '" 吗？' : "确定要删除选择的 " + a.length + " 项吗？", function() {
            Wb.request({
                url: "builder?xwl=dev/ide/delete",
                timeout: -1,
                params: {
                    files: Wb.encode(c)
                },
                success: function() {
                    var d;
                    Wb.each(a, function(e) {
                        d = Ide.getPath(e) + "/";
                        Ide.fileTab.items.each(function(f) {
                            if (Ide.isChild(f.path, d) || f.runFile && Ide.isChild(f.runFile, d)) {
                                f.isModified = false;
                                f.close()
                            }
                        })
                    });
                    Wb.remove(Ide.fileTree, a)
                }
            })
        }, Ide.fileTree.view.getNode(a[0]))
    },
    setTheme: function(a) {
        var b = a.itemId.slice(0, -3);
        Wb.request({
            url: "builder?xwl=dev/ide/set-options",
            params: {
                name: "theme",
                value: b,
                sessionName: "sys.theme"
            },
            success: function() {
                Wb.confirm("设置成功，刷新当前窗口吗？", function() {
                    location.reload()
                })
            }
        })
    },
    setEditTheme: function(b) {
        var a = b.itemId.slice(0, -5);
        Wb.request({
            url: "builder?xwl=dev/ide/set-options",
            params: {
                name: "editTheme",
                value: a,
                sessionName: "sys.editTheme"
            },
            success: function() {
                Wb.editTheme = a;
                Ide.fileTab.items.each(function(c) {
                    if (c.editor) {
                        c.editor.setOption("theme", a)
                    }
                    c.items.each(function(d) {
                        if (d.editor) {
                            d.editor.setOption("theme", a)
                        }
                    })
                })
            }
        })
    },
    open: function() {
        var a = Ide.fileTree.getSelection(),
            b = [];
        Wb.each(a, function(c) {
            if (c.isLeaf()) {
                b.push(Ide.getPath(c))
            }
        });
        if (!b.length) {
            Wb.warn("请选择至少一个需要打开的文件。");
            return
        }
        Ide.doOpen(b)
    },
    doOpen: function(d, e) {
        if (!Ext.isArray(d)) {
            d = [d]
        }
        var c = [],
            a, b;
        Wb.each(d, function(f) {
            a = Ide.fileTab.child("[path=" + f + "]");
            if (a) {
                if (!b) {
                    b = a
                }
            } else {
                c.push(f)
            }
        });
        if (!c.length) {
            Ide.fileTab.setActiveTab(b);
            Ext.callback(e, this, [b], 20);
            return
        }
        Wb.request({
            url: "builder?xwl=dev/ide/open",
            params: {
                fileNames: Wb.encode(c)
            },
            success: function(h) {
                var g = Wb.decode(h.responseText),
                    f;
                Ext.suspendLayouts();
                Wb.each(g, function(i) {
                    f = i.path.slice(-3).toLowerCase();
                    if (f == "xwl") {
                        a = Ide.openModule(i)
                    } else {
                        a = Ide.openFile(Ide.fileTab, i)
                    }
                    if (!b) {
                        b = a
                    }
                });
                Ide.fileTab.setActiveTab(b);
                Ext.callback(e, this, [b], 20);
                Ext.resumeLayouts(true)
            }
        })
    },
    openFile: function(d, e, f, h) {
        var c, b, a = e.sourceCard;
        b = Wb.extractFileExt(e.file).toLowerCase();
        c = {
            html: "<textarea></textarea>",
            title: Ext.String.ellipsis(f ? e.title : e.file, 20),
            closable: !a,
            border: f,
            hideMode: Ext.isIE ? "offsets" : "display",
            reorderable: !a,
            bbar: ["->", {
                text: "1 : 1",
                xtype: "tbtext",
                itemId: "cursorLabel",
                minWidth: 90,
                style: "text-align:right"
            }, " "],
            listeners: {
                activate: function(i) {
                    if (a) {
                        Ide.createScript(i.ownerCt, i)
                    }
                    if (i.lastScrollInfo) {
                        i.editor.scrollTo(i.lastScrollInfo.left, i.lastScrollInfo.top)
                    }
                    setTimeout(function() {
                        try {
                            if (i.editor.needRefresh) {
                                i.editor.refresh();
                                i.editor.needRefresh = false
                            }
                            i.editor.focus()
                        } catch (j) {}
                    }, 10)
                },
                beforedeactivate: function(i) {
                    i.lastScrollInfo = i.editor.getScrollInfo()
                },
                resize: function(k, j, i) {
                    if (k.editor && !k.destroying) {
                        Ext.fly(k.editor.getScrollerElement()).setHeight(k.body.getHeight() - 4);
                        k.editor.refresh()
                    }
                },
                close: function(i) {
                    Ide.clearMarkers(i.innerMode ? i.ownerCt.path : i.path, i.innerMode ? i : null)
                },
                afterrender: {
                    single: true,
                    fn: function(l) {
                        var j, i, k;
                        l.toolbar = l.down("toolbar");
                        l.cursorLabel = l.down("[itemId=cursorLabel]");
                        l.funcBtn = l.down("[itemId=funcBtn]");
                        l.paramsLbl = l.down("[itemId=paramsLbl]");
                        if (e.params) {
                            l.paramsLbl.setText("(" + e.params.join(", ") + ")")
                        } else {
                            l.toolbar.remove(l.paramsLbl)
                        }
                        if (l.innerMode) {
                            if (a) {
                                l.funcBtn.setText("只读");
                                l.funcBtn.setDisabled(true)
                            } else {
                                l.funcBtn.setText(Ide.getNodePath(e.node))
                            }
                        }
                        i = {
                            lineNumbers: true,
                            readOnly: a,
                            theme: Wb.editTheme,
                            extraKeys: {
                                "Ctrl-/": "toggleComment",
                                "Ctrl-,": function(m) {
                                    if (m.modifyCursor) {
                                        m.setCursor(m.modifyCursor)
                                    }
                                },
                                "Shift-Ctrl-F": function(n) {
                                    if (n.options.readOnly) {
                                        return
                                    }
                                    var o = n.getCursor(),
                                        m = n.getScrollInfo();
                                    Ide.clearBookmark();
                                    n.autoFormatRange({
                                        line: 0,
                                        ch: 0
                                    }, {
                                        line: Number.MAX_VALUE,
                                        ch: Number.MAX_VALUE
                                    });
                                    n.scrollTo(m.left, m.top);
                                    n.setCursor(o)
                                }
                            }
                        };
                        switch (b) {
                            case "js":
                            case "ss":
                                i.highlightSelectionMatches = {
                                    showToken: /\w/
                                };
                                i.isServerScript = b == "ss";
                                i.extraKeys["Alt-/"] = "autocomplete";
                                i.extraKeys["."] = function(m) {
                                    if (m.options.readOnly) {
                                        return
                                    }
                                    m.replaceSelection(".");
                                    if (m.hintTimer) {
                                        clearTimeout(m.hintTimer)
                                    }
                                    m.hintTimer = setTimeout(function() {
                                        CodeMirror.showHint(m)
                                    }, 100)
                                };
                                k = {
                                    mode: {
                                        name: "text/javascript",
                                        globalVars: true
                                    },
                                    gutters: ["CodeMirror-lint-markers"],
                                    lint: true,
                                    matchBrackets: true
                                };
                                break;
                            case "css":
                                k = {
                                    mode: "text/css",
                                    gutters: ["CodeMirror-lint-markers"],
                                    lint: true,
                                    matchBrackets: true
                                };
                                break;
                            case "java":
                                i.highlightSelectionMatches = {
                                    showToken: /\w/
                                };
                                k = {
                                    mode: "text/x-java",
                                    matchBrackets: true
                                };
                                break;
                            case "xml":
                                k = {
                                    mode: "application/xml",
                                    matchBrackets: true
                                };
                                break;
                            case "html":
                            case "htm":
                            case "htxt":
                                k = {
                                    mode: "htmlmixed",
                                    matchBrackets: true
                                };
                                break;
                            case "jsp":
                            case "jspx":
                                i.highlightSelectionMatches = {
                                    showToken: /\w/
                                };
                                k = {
                                    mode: "application/x-jsp",
                                    matchBrackets: true
                                };
                                break;
                            case "json":
                            case "expjson":
                                k = {
                                    mode: "application/json",
                                    gutters: ["CodeMirror-lint-markers"],
                                    matchBrackets: true
                                };
                                break;
                            case "sql":
                                k = {
                                    mode: "text/x-sql",
                                    matchBrackets: true
                                };
                                break;
                            default:
                                k = {
                                    mode: "text/plain"
                                }
                        }
                        Ext.apply(i, k);
                        j = CodeMirror.fromTextArea(l.el.down("textarea", true), i);
                        j.card = l;
                        j.cursorLabel = l.cursorLabel;
                        l.editor = j;
                        setTimeout(function() {
                            if (b == "js" || b == "ss" || b == "css") {
                                if (e.content.length > 0) {
                                    j.lintCallback = function(m) {
                                        Ide.getMarkers(j, e.path, f ? j.card : null)
                                    }
                                }
                            }
                            j.setValue(e.content);
                            j.savedText = e.content;
                            j.on("change", function(n) {
                                if (n.notRecordChange) {
                                    return
                                }
                                var m = n.card;
                                n.modifyCursor = Ext.apply({}, n.lastCursor);
                                if (!m.isModified && n.savedText !== n.getValue()) {
                                    if (m.innerMode) {
                                        m.isModified = true;
                                        Ide.setModified(m.ownerCt)
                                    } else {
                                        Ide.setModified(m)
                                    }
                                }
                            });
                            j.on("cursorActivity", function(m) {
                                var n = m.getCursor();
                                m.lastCursor = n;
                                m.cursorLabel.setText((n.line + 1) + " : " + (n.ch + 1));
                                Ide.recordActivity()
                            });
                            j.clearHistory();
                            Ext.callback(h, this, [j])
                        }, 10)
                    }
                }
            }
        };
        if (!a) {
            Ext.apply(c, {
                tabConfig: {
                    tooltip: f ? (Ide.getNodePath(e.node) + "/" + e.itemName) : Ide.getPathText(e.path)
                }
            })
        }
        if (f) {
            c.bbar.unshift({
                itemId: "funcBtn",
                handler: Ide.toggleEditor
            });
            c.bbar.push({
                itemId: "paramsLbl",
                xtype: "tbtext"
            });
            Ext.apply(c, {
                iconCls: e.iconCls,
                node: e.node,
                innerMode: true,
                sourceCard: a,
                fileExt: b,
                itemName: e.itemName,
                itemType: e.itemType
            });
            if (!a) {
                Ext.apply(c, {
                    commitChange: function() {
                        var i = this;
                        if (i.isModified) {
                            Ide.updateProperty(i.ownerCt.property, i.node, i.itemType, i.itemName, i.editor.getValue(), true);
                            i.editor.savedText = i.editor.getValue();
                            i.isModified = false
                        }
                    }
                });
                Ext.apply(c.listeners, {
                    beforedeactivate: function(i) {
                        i.commitChange()
                    }
                })
            }
        } else {
            var g = Wb.indexOf(["gif", "jpg", "png", "bmp"], b) != -1;
            c.bbar.unshift({
                itemId: "funcBtn",
                text: g ? "Base64" : e.charset,
                disabled: g,
                handler: Ide.setCharset
            });
            Ext.apply(c, {
                path: e.path,
                file: e.file,
                icon: e.icon,
                lastModified: Wb.strToDate(e.lastModified)
            });
            Ext.apply(c.listeners, {
                beforeclose: function(i) {
                    if (i.isModified) {
                        Wb.choose('"' + i.file + '" 已经被修改，保存所做的更改吗？', function(j) {
                            if (j == "yes") {
                                Ide.saveFile(false, function() {
                                    i.close()
                                })
                            } else {
                                if (j == "no") {
                                    Wb.unModified(i);
                                    i.close()
                                }
                            }
                        });
                        return false
                    }
                }
            })
        }
        return d.add(c)
    },
    updateProperty: function(d, f, e, c, g, b) {
        var h, a;
        if (f == d.node) {
            a = d.store.findBy(function(i) {
                return i.data.type == e && i.data.name == c
            });
            h = d.store.getAt(a);
            d.store.stopUpdate = true;
            if (b) {
                h.set("value", Wb.toLine(g, 200))
            } else {
                h.set("value", g)
            }
            d.store.stopUpdate = false
        }
        e = e.toLowerCase();
        if (!f.data[e]) {
            f.data[e] = {}
        }
        f.data[e][c] = g;
        if (c == "itemId") {
            f.set("text", g);
            f.commit()
        }
    },
    setFileDrop: function(a) {
        function b(f) {
            var d = a.view,
                c = f.getTarget(d.cellSelector.cellSelector);
            if (c) {
                return d.getRecord(d.findItemByChild(c))
            } else {
                return null
            }
        }
        new Ext.dd.DropTarget(a.body.dom, {
            ddGroup: "file",
            notifyOver: function(h, i, g) {
                var d, f, c;
                c = b(i);
                if (c) {
                    Wb.each(g.records, function(e) {
                        if (!e.isLeaf() || !Ide.getWebPath(e)) {
                            f = true;
                            return false
                        }
                    });
                    if (!f) {
                        d = true
                    }
                }
                this.acceptDrop = d;
                if (d) {
                    a.setSelection(c);
                    return this.dropAllowed
                }
            },
            notifyDrop: function(c, k, h) {
                if (this.acceptDrop) {
                    var n, o, f, j, i = b(k),
                        g = i.data.type,
                        l = g.toLowerCase(),
                        d = i.data.name,
                        m = i.get("value");
                    n = Ide.getMetaControl(a.node).data[l][d];
                    f = n.type == "urlList";
                    if ((k.ctrlKey || k.shiftKey) && m && f && Ext.String.startsWith(Ext.String.trim(m), "[")) {
                        m = Wb.decode(m)
                    } else {
                        m = []
                    }
                    Wb.each(h.records, function(e) {
                        o = Ide.getNodeUrl(e);
                        j = Wb.indexOf(m, o);
                        if (k.shiftKey) {
                            if (j != -1) {
                                m.splice(j, 1)
                            }
                        } else {
                            if (j == -1) {
                                m.push(o)
                            }
                        }
                    });
                    if (m.length) {
                        if (f) {
                            m = '["' + m.join('", "') + '"]'
                        } else {
                            m = m[0]
                        }
                    } else {
                        m = ""
                    }
                    Ide.updateProperty(a, a.node, g, d, m);
                    Ide.setModified()
                }
            }
        })
    },
    notifyChange: function() {
        Ide.setModified()
    },
    getSelFiles: function() {
        var d, b = app.fileTree.getSelection(),
            c = [],
            a = app.fileTree.selModel;
        if (!b.length) {
            Wb.warn("请选择至少1个文件或目录。");
            return false
        }
        Wb.each(b, function(e) {
            d = false;
            e.bubble(function(f) {
                if (f == e) {
                    return
                }
                if (a.isSelected(f)) {
                    d = true;
                    return false
                }
            });
            if (d) {
                return
            }
            c.push(app.getPath(e))
        });
        return c
    },
    checkIn: function() {
        var c, a, b = app.fileTree.getSelection();
        if (b.length != 1) {
            Wb.warn("请选择1个需要检入的文件或目录。");
            return
        }
        a = b[0];
        c = Ide.getPath(a);
        if (!Ext.String.startsWith(c + "/", Ide.webPath)) {
            Wb.warn("选择的文件“" + c + "”位于应用目录之外。");
            return
        }
        Wb.run({
            url: "builder?xwl=dev/ide/version/check-in-win",
            single: true,
            success: function(d) {
                d.show(function(e, f) {
                    Wb.request({
                        url: "builder?xwl=dev/ide/version/check-in",
                        params: f,
                        timeout: -1,
                        success: function(g) {
                            e.close();
                            Wb.reload(app.fileTree)
                        }
                    })
                }, c.substring(Ide.webPath.length) + (a.isLeaf() ? "" : "/"), Wb.getInfo(app.fileTree))
            }
        })
    },
    checkOut: function() {
        var a, b = app.getSelFiles();
        if (!b) {
            return
        }
        Wb.each(b, function(c) {
            if (!Ext.String.startsWith(c + "/", Ide.webPath)) {
                Wb.warn("选择的文件“" + c + "”位于应用目录之外。");
                a = true;
                return false
            }
        });
        if (a) {
            return
        }
        Wb.run({
            url: "builder?xwl=dev/ide/version/check-out-win",
            single: true,
            success: function(c) {
                c.show(function(d) {
                    Wb.request({
                        url: "builder?xwl=dev/ide/version/check-out",
                        params: {
                            files: b
                        },
                        timeout: -1,
                        out: d,
                        success: function(e) {
                            d.close();
                            Wb.tip("选择的文件已经成功检出。")
                        }
                    })
                }, Wb.getInfo(app.fileTree))
            }
        })
    },
    editString: function(a) {
        var b = {
            xtype: "textfield",
            listeners: {
                change: Ide.notifyChange
            }
        };
        if (a) {
            Ext.apply(b, {
                allowBlank: false,
                validator: Ide.nodeItemIdValidator
            })
        }
        return b
    },
    editBind: function(a) {
        return {
            xtype: "combo",
            store: [],
            bindConfig: a,
            listeners: {
                change: Ide.notifyChange,
                focus: Ide.getBindData
            }
        }
    },
    getBindData: function(a) {
        var i, j, b, k = Ide.activeCard.tree,
            c = a.bindConfig,
            d = k.getRootNode(),
            e = c.app !== false,
            g = [];
        if (c.owned) {
            b = Ide.activeCard.property.node
        } else {
            b = d
        }

        function f(l) {
            var m = false;
            Wb.each(g, function(n) {
                if (n.field1 == l.field1) {
                    m = true;
                    return false
                }
            });
            if (!m) {
                g.push(l)
            }
        }

        function h(l) {
            var m;
            Wb.each(c.controls, function(o) {
                var p = Wb.namePart(o),
                    n = Wb.valuePart(o);
                if ((p == i || p == "*") && (n === "" || l.firstChild && n == l.firstChild.data.type)) {
                    m = true;
                    return false
                }
            });
            return m
        }
        b[c.deep !== false ? "cascadeBy" : "eachChild"](function(l) {
            if (c.owned && b == l || l === d) {
                return
            }
            i = l.data.type;
            j = l.parentNode ? l.parentNode.data.type : "";
            if ((c.root === false || j == "module" || j == "folder") && h(l)) {
                if (Wb.verifyName(l.data.text) === true) {
                    f({
                        field1: (e ? "app." : "") + l.data.text
                    })
                } else {
                    if (e) {
                        f({
                            field1: 'app["' + l.data.text + '"]'
                        })
                    } else {
                        f({
                            field1: l.data.text
                        })
                    }
                }
            }
        });
        g.sort(function(m, l) {
            return m.field1.toUpperCase().localeCompare(l.field1.toUpperCase())
        });
        a.store.loadData(g)
    },
    editJndi: function() {
        return {
            xtype: "combo",
            store: Ide.jndiList,
            listeners: {
                change: Ide.notifyChange
            }
        }
    },
    editEnum: function(a) {
        return {
            xtype: "combo",
            store: a,
            listeners: {
                change: Ide.notifyChange
            }
        }
    },
    editIconCls: function() {
        return {
            xtype: "combo",
            store: Ide.iconData,
            anyMatch: true,
            getValue: function() {
                var b, a = Ext.form.field.ComboBox.prototype.getValue.apply(this, arguments);
                if (a && !Ext.String.endsWith(a, "_icon")) {
                    b = this.store.findExactRec("field1", a + "_icon");
                    if (b) {
                        return b.data.field1
                    }
                }
                return a
            },
            tpl: ['<div><tpl for=".">', '<div class="x-boundlist-item wb_thumb" data-qtip="{field1}"><div class="wb_icon1 {field1}"></div></div>', "</tpl></div>"],
            listeners: {
                change: Ide.notifyChange
            }
        }
    },
    editGlyph: function() {
        return {
            xtype: "combo",
            store: Ide.glyphClasses,
            anyMatch: true,
            tpl: ['<div><tpl for=".">', '<div class="x-boundlist-item wb_thumb wb_glyph3 ide_glyph" data-qtip="{field2} ({field1})">', "{[String.fromCharCode(parseInt(values.field1,16))]}", "</div></tpl></div>"],
            getValue: function() {
                var b, a = Ext.form.field.ComboBox.prototype.getValue.apply(this, arguments);
                b = this.store.findExactRec("field2", a);
                if (b) {
                    return b.data.field1
                } else {
                    return a
                }
            },
            listeners: {
                change: Ide.notifyChange
            }
        }
    },
    doEdit: function(n, h, b) {
        var c = Ide.activeCard.property,
            j = c.getSelection()[0],
            g = c.store.node,
            k = Ide.getMetaControl(g),
            l, o, a, i, e, f, m = {
                text: "file_txt_icon",
                html: "web_icon",
                js: "file_js_icon",
                ss: "file_ss_icon",
                sql: "sql_icon",
                expJson: "object_icon"
            };
        if (!j) {
            if (!n) {
                Wb.warn("请选择需要编辑的属性/事件。")
            }
            return
        }
        if (!k) {
            if (!n) {
                Wb.warn('控件 "' + g.data.type + '" 没有找到。')
            }
            return
        }
        l = j.data.type;
        a = l.toLowerCase();
        o = j.data.name;
        i = k.data[a][o];
        if (!i) {
            if (!n) {
                Wb.warn("该属性没有定义。")
            }
            return
        }
        e = i.type;
        if (!m[e]) {
            if (!n) {
                Wb.warn("该属性没有定义编辑器。")
            }
            return
        }
        c.editPlugin.completeEdit();
        Ide.activeCard.items.each(function(p) {
            if (p.editor && p.node == g && p.itemName == o && p.itemType == l) {
                f = p;
                return false
            }
        });

        function d() {
            f.ownerCt.setActiveTab(f);
            if (h !== undefined) {
                f.editor.setCursor(h - 1, b);
                f.editor.focus()
            }
        }
        if (f) {
            d()
        } else {
            f = Ide.openFile(Ide.activeCard, {
                content: (g.data[a] || {})[o] || "",
                file: "." + e,
                title: g.data.text + "." + o,
                node: g,
                path: Ide.activeCard.path,
                params: i.params,
                itemName: o,
                itemType: l,
                iconCls: m[e]
            }, true, d)
        }
    },
    editColor: function() {
        return {
            xtype: "colorfield",
            listeners: {
                change: Ide.notifyChange
            }
        }
    },
    editText: function() {
        return {
            xtype: "trigger",
            editable: false,
            fieldCls: "wb-disabled x-form-field",
            triggerCls: "x-form-ellipsis-trigger",
            onTriggerClick: function() {
                this.ownerCt.completeEdit();
                Ide.doEdit()
            },
            listeners: {
                afterrender: {
                    single: true,
                    fn: function(a) {
                        a.mon(a.inputEl, "dblclick", function() {
                            a.ownerCt.completeEdit();
                            Ide.doEdit()
                        })
                    }
                }
            }
        }
    },
    getMetaControl: function(a) {
        return Ide.controlMap[a.data.type]
    },
    destroyEditors: function(c) {
        var b, a = c.sourceConfig;
        Wb.each(a, function(d, e) {
            b = e.editor;
            if (Ext.isFunction(b.destroy)) {
                b.destroy()
            }
        })
    },
    forceVisible: function(a) {
        var b = Ide.fileTab.tabBar.layout.overflowHandler;
        if (b && a) {
            b.scrollToItem(a.tab)
        }
    },
    loadProperties: function(c, e) {
        var b, g, d = [],
            h = {},
            f = Ide.getMetaControl(c);
        if (!f) {
            Wb.warn('控件 "' + c.data.type + '" 没有找到。');
            return
        }

        function a(k, i, l) {
            var m, j;
            Wb.each(i, function(n, o) {
                if (n == "itemId") {
                    o.bold = true
                }
                m = false;
                switch (o.type) {
                    case "expBool":
                        h[n] = {
                            editor: Ide.editEnum(["true", "false"])
                        };
                        break;
                    case "enum":
                        h[n] = {
                            editor: Ide.editEnum(o.list || o.params)
                        };
                        break;
                    case "jndi":
                        h[n] = {
                            editor: Ide.editJndi()
                        };
                        break;
                    case "iconCls":
                        h[n] = {
                            editor: Ide.editIconCls()
                        };
                        break;
                    case "glyph":
                        h[n] = {
                            editor: Ide.editGlyph()
                        };
                        break;
                    case "bind":
                    case "expBind":
                        h[n] = {
                            editor: Ide.editBind(o)
                        };
                        break;
                    case "color":
                        h[n] = {
                            editor: Ide.editColor()
                        };
                        break;
                    case "text":
                    case "html":
                    case "js":
                    case "ss":
                    case "sql":
                    case "expJson":
                        m = true;
                        h[n] = {
                            editor: Ide.editText()
                        };
                        break;
                    default:
                        h[n] = {
                            editor: Ide.editString(n == "itemId")
                        };
                        break
                }
                j = k[n] || "";
                d.push({
                    type: l,
                    name: n,
                    value: m ? Wb.toLine(j, 200) : j,
                    meta: o
                })
            });
            Wb.each(k, function(n, o) {
                if (!i[n]) {
                    d.push({
                        type: l,
                        name: n,
                        value: o,
                        meta: Ext.apply({
                            deprecated: true
                        }, o)
                    });
                    h[n] = {
                        editor: Ide.editString()
                    }
                }
            })
        }
        a(c.data.configs || {}, f.data.configs, "Configs");
        a(c.data.events || {}, f.data.events, "Events");
        e.node = c;
        e.store.node = c;
        e.suspendEvents();
        Ide.destroyEditors(e);
        e.sourceConfig = h;
        g = e.getSelection()[0];
        if (g) {
            b = g.data.name
        }
        e.store.loadData(d);
        if (b) {
            g = e.store.findExact("name", b);
            if (g != -1) {
                e.setSelection(g)
            }
        }
        e.resumeEvents()
    },
    toggleRun: function() {
        if (Ide.runBtn.disabled) {
            return
        }
        var a, b = Ide.activeCard.runFile;
        if (b) {
            Ide.doOpen(b)
        } else {
            if (Ide.activeCard.path) {
                a = Ide.fileTab.child("[runFile=" + Ide.activeCard.path + "]");
                if (a) {
                    Ide.fileTab.setActiveTab(a)
                } else {
                    Ide.run()
                }
            }
        }
    },
    openModule: function(a) {
        var b;
        b = Ide.fileTab.add({
            xtype: "tabpanel",
            title: Ext.String.ellipsis(a.file, 20),
            tabConfig: {
                tooltip: Ide.getPathText(a.path)
            },
            iconCls: a.iconCls,
            path: a.path,
            cardType: "module",
            border: false,
            file: a.file,
            hideMode: Ext.isIE ? "offsets" : "display",
            lastModified: a.lastModified,
            closable: true,
            deferredRender: false,
            region: "center",
            plugins: ["tabreorderer", "tabclosemenu"],
            commitChange: function() {
                var d = this,
                    c = d.getActiveTab();
                if (c.commitChange) {
                    c.commitChange()
                }
            },
            listeners: {
                afterrender: {
                    single: true,
                    fn: function(c) {
                        var d = c.getComponent("designCard");
                        c.designCard = d;
                        c.property = d.getComponent("property");
                        c.tree = d.getComponent("tree")
                    }
                },
                activate: function(d) {
                    var c = d.getActiveTab();
                    if (!c) {
                        return
                    }
                    if (c.lastScrollInfo) {
                        c.editor.scrollTo(c.lastScrollInfo.left, c.lastScrollInfo.top)
                    }
                    setTimeout(function() {
                        try {
                            if (c.editor.needRefresh) {
                                c.editor.refresh();
                                c.editor.needRefresh = false
                            }
                            c.editor.focus()
                        } catch (f) {}
                    }, 10)
                },
                beforetabchange: function(e, c, d) {
                    var f = c.itemId == "designCard";
                    if (c.layoutCard || f) {
                        Ide.controlTree.show()
                    } else {
                        Ide.controlTree.hide()
                    }
                    Ide.forceVisible(c.ownerCt)
                },
                tabchange: function(e, c, d) {
                    Ide.recordActivity()
                },
                beforeclose: function(c) {
                    if (c.isModified) {
                        Wb.choose('"' + c.file + '" 已经被修改，保存所做的更改吗？', function(d) {
                            if (d == "yes") {
                                Ide.saveFile(false, function() {
                                    c.close()
                                })
                            } else {
                                if (d == "no") {
                                    Wb.unModified(c);
                                    c.close()
                                }
                            }
                        });
                        return false
                    }
                },
                close: function(c) {
                    Ide.clearMarkers(c.path)
                }
            },
            items: [{
                xtype: "container",
                itemId: "designCard",
                layout: "border",
                title: "设计",
                border: false,
                iconCls: "model_icon",
                reorderable: false,
                commitChange: function() {
                    var d = this.ownerCt.property,
                        c = d.editPlugin;
                    if (c.editing) {
                        c.completeEdit()
                    }
                },
                items: [{
                    itemId: "property",
                    xtype: "propertygrid",
                    region: "west",
                    split: true,
                    width: 440,
                    style: "border:0 1px 0 0;",
                    nameColumnWidth: 150,
                    viewConfig: {
                        stripeRows: false
                    },
                    store: new Ext.data.Store({
                        fields: ["type", "meta", "name", "value"],
                        groupField: "type",
                        listeners: {
                            update: function(h, c, d) {
                                if (d == "commit" && !h.stopUpdate) {
                                    var e = c.get("name"),
                                        i = c.get("value") || "",
                                        g = h.node,
                                        f = c.get("type").toLowerCase();
                                    if (!g.data[f]) {
                                        g.data[f] = {}
                                    }
                                    g.data[f][e] = i;
                                    if (e == "itemId") {
                                        Ide.syncBindRef(g.data.text, i);
                                        g.set("text", i);
                                        g.commit();
                                        Ide.syncNodes(g)
                                    } else {
                                        if (e == "normalName") {
                                            g.set("normalName", i);
                                            g.commit()
                                        }
                                    }
                                }
                            }
                        }
                    }),
                    features: [{
                        ftype: "grouping",
                        groupHeaderTpl: "{name}",
                        collapsible: false
                    }],
                    listeners: {
                        beforedestroy: function(c) {
                            Ide.destroyEditors(c)
                        },
                        afterrender: {
                            single: true,
                            fn: function(c) {
                                Ide.setFileDrop(c);
                                c.editPlugin = c.findPlugin("cellediting");
                                c.columns[0].renderer = function(f, g, d) {
                                    var e = d.data.meta;
                                    g.tdCls = "wb-solid";
                                    if (e.deprecated) {
                                        g.style = "text-decoration:line-through;"
                                    }
                                    if (e.type == "exp") {
                                        f += ":"
                                    }
                                    if (e.bold) {
                                        return "<strong>" + f + "</strong>"
                                    } else {
                                        return f
                                    }
                                };
                                c.columns[1].renderer = function(g, h, d) {
                                    if (g) {
                                        if (!Ext.String.startsWith(g, "@")) {
                                            var f, e = d.data.meta.type;
                                            switch (e) {
                                                case "iconCls":
                                                    g = Wb.getIcon(g) + g;
                                                    break;
                                                case "color":
                                                    g = '<div class="wb_icon" style="background-color:' + g + ';"></div>' + g;
                                                    break;
                                                case "glyph":
                                                    f = Wb.find(Ide.glyphClasses, 0, g);
                                                    g = '<span class="wb_glyph wb_height12"> ' + String.fromCharCode(parseInt(g, 16)) + "</span> " + (f ? f[1] : "") + " (" + g + ")";
                                                    break;
                                                default:
                                                    g = Ext.htmlEncode(Ext.String.ellipsis(g, 200))
                                            }
                                        } else {
                                            g = Ext.htmlEncode(Ext.String.ellipsis(g, 200))
                                        }
                                    }
                                    return g
                                }
                            }
                        }
                    }
                }, {
                    itemId: "tree",
                    xtype: "treepanel",
                    region: "center",
                    title: "对象视图",
                    iconCls: "list_icon",
                    multiSelect: true,
                    popupMenu: app.objectViewMenu,
                    tools: Wb.getTreeTools({
                        refresh: false,
                        search: true
                    }),
                    rootVisible: false,
                    hideHeaders: true,
                    cls: "x-autowidth-table",
                    columns: [{
                        xtype: "treecolumn",
                        dataIndex: "text",
                        width: Ext.isIE6 ? "100%" : 10000,
                        renderer: function(e, f, c) {
                            var d = c.data.configs.normalName;
                            e = Wb.encodeHtml(e);
                            if (d) {
                                return e + " (" + Wb.encodeHtml(d) + ")"
                            } else {
                                return e
                            }
                        }
                    }],
                    store: {
                        fields: ["type", "text", "configs", "events", "meta", "title", "pageLink", {
                            name: "hidden",
                            type: "bool"
                        }, {
                            name: "inframe",
                            type: "bool"
                        }],
                        root: a
                    },
                    listeners: {
                        selectionchange: function(c, d) {
                            var e = d[0];
                            if (!e) {
                                e = this.getRootNode().firstChild
                            }
                            Ide.loadProperties(e, this.up("tabpanel").property)
                        }
                    },
                    viewConfig: {
                        plugins: {
                            ptype: "treeviewdragdrop",
                            ddGroup: "controlList"
                        },
                        listeners: {
                            beforedrop: function(d, f, c, g, e) {
                                if (f.view === Ide.controlTree.view) {
                                    f.copy = true
                                }
                                Ide.autoRename(g == "append" ? c : c.parentNode, f.records, e)
                            },
                            drop: function(f, g, d, h) {
                                var e, c = d.getOwnerTree();
                                if (g.view == Ide.controlTree.view) {
                                    e = g.records[0];
                                    Ide.setNewNode(e, e.parentNode);
                                    c.setSelection(e);
                                    Ide.activeCmp = "control"
                                } else {
                                    Ide.autoRename(h == "append" ? d : d.parentNode, g.records);
                                    c.setSelection(g.records);
                                    Ide.syncNodes(g.records)
                                }
                                Ide.setModified()
                            },
                            nodedragover: function(d, f, e) {
                                var c = e.records[0];
                                if (c.getOwnerTree() == Ide.controlTree && !c.data.control || d.getDepth() == 1 && f != "append") {
                                    return false
                                }
                            }
                        }
                    }
                }]
            }]
        });
        Ide.fileTab.setActiveTab(b);
        Wb.selFirst(b.tree);
        Ide.openFile(Ide.activeCard, {
            content: "",
            file: ".js",
            title: "源码",
            sourceCard: true,
            itemId: "scriptCard",
            path: Ide.activeCard.path,
            iconCls: "script_icon",
            reorderable: false
        }, true);
        Ide.activeCmp = "control";
        return b
    },
    setNewNode: function(b, f, l, k) {
        function e(q, r) {
            var p, o = {},
                n = 1;
            f.eachChild(function(s) {
                o[s.data.configs.itemId] = true
            });
            if (r) {
                Wb.each(r, function(s) {
                    if (!o[s]) {
                        p = s;
                        return false
                    }
                });
                if (p) {
                    return p
                }
            }
            while (o[q + n]) {
                n++
            }
            return q + n
        }
        var m = f.getOwnerTree(),
            i = b.data.id,
            h = Ide.getMetaControl(b),
            a = Ide.getMetaControl(f),
            c = b.data.general.autoNames,
            d, j, g;
        if (h.data.general.tag && h.data.general.tag.lib == 2 && Ext.String.startsWith(i, "t")) {
            i = i.substring(1)
        }
        if (c && (d = (c[f.data.type] || (a.data.general.root ? null : c.any)))) {
            j = e(i, d.split(","))
        } else {
            if (l) {
                j = i
            } else {
                j = e(i)
            }
        }
        m.suspendEvents();
        b.set("id", Wb.getId());
        b.set("text", j);
        delete b.data.general;
        g = {
            itemId: j
        };
        Wb.each(h.data.configs, function(n, o) {
            if (Wb.isValue(o.value)) {
                g[n] = o.value.toString()
            }
        });
        if (Ide.anchorRightBtn.pressed && b.data.configs.labelAlign) {
            g.labelAlign = "right"
        }
        if (k) {
            Ext.apply(g, k)
        }
        b.set("configs", g);
        b.set("events", null);
        b.commit();
        m.resumeEvents()
    },
    addControl: function(c, i, h) {
        if (!Ide.activeCard || !c.data.control) {
            return
        }
        var j = Ide.activeCard.tree,
            e = j.getSelection(),
            b, f = j.getRootNode(),
            g, a, d;
        g = c.copy();
        if (h) {
            d = h.node;
            delete h.node;
            Ide.setNewNode(g, d, i, h);
            b = Wb.append(g, d, false, false)
        } else {
            if (f.firstChild) {
                f = f.firstChild
            }
            if (e.length === 0) {
                b = f
            } else {
                b = e[0]
            }
            if (Ext.EventObject.ctrlKey || b == f) {
                Ide.setNewNode(g, b, i);
                b = Wb.append(g, b)
            } else {
                Ide.setNewNode(g, b.parentNode, i);
                b = Wb.insertAfter(g, b)
            }
        }
        Ide.activeCmp = "control";
        Ide.setModified();
        if (h) {
            Ide.activeCard.getActiveTab().comps.itemId.focus(true, true)
        }
        return b[0]
    },
    run: function() {
        if (Ide.runBtn.disabled) {
            return
        }
        var a = Ide.activeCard;
        if (a.bindFile) {
            Wb.open({
                reloadCard: a,
                success: function(b) {
                    if (Ide.activeCard === this) {
                        Ide.activeScope = b
                    }
                }
            })
        } else {
            Ide.saveFile(false, function() {
                var b, d = Ide.getPathText(a.path),
                    c = a.tree ? a.tree.getRootNode().data : null;
                b = Wb.open(Ext.apply({
                    url: Wb.toUrl(d),
                    title: a.file,
                    iconCls: "web_icon",
                    inframe: c ? c.inframe : true,
                    tooltip: d,
                    reload: true,
                    success: function(e) {
                        if (Ide.activeCard === this) {
                            Ide.activeScope = e
                        }
                    }
                }, (c && c.pageLink) ? Wb.decode(c.pageLink) : null));
                if (b) {
                    b.runFile = a.path
                }
            })
        }
    },
    toggleEditor: function() {
        var d, b = Ide.activeCard;
        if (b && b.cardType == "module") {
            d = b.getActiveTab()
        }
        if (!(d && (d == b.designCard || d.itemType && d.itemName))) {
            Wb.warn("请在模块编辑器属性或脚本编辑器之间进行切换。");
            return
        }
        if (b.getActiveTab() == b.designCard) {
            Ide.doEdit()
        } else {
            var a, c = b.property;
            b.setActiveTab("designCard");
            b.tree.setSelection(d.node);
            a = c.store.findBy(function(e) {
                return e.data.type == d.itemType && e.data.name == d.itemName
            });
            c.setSelection(a);
            c.view.focusRow(a)
        }
    },
    setButtons: function() {
        var b = Ide.activeCard,
            a = Wb.getModifiedTitle(Ide.fileTab) !== null;
        Ide.saveBtn.setDisabled(!(b && b.isModified));
        Ide.saveBtn.setIconCls("save" + (Ide.saveBtn.disabled ? "_disabled" : "") + "_icon");
        Ide.saveAllBtn.setDisabled(!a);
        Ide.saveAllBtn.setIconCls("save_all" + (Ide.saveAllBtn.disabled ? "_disabled" : "") + "_icon");
        Ide.runBtn.setDisabled(!(b && (b.bindFile || Ide.getFileUrl(b.path))));
        Ide.runBtn.setIconCls("run" + (Ide.runBtn.disabled ? "_disabled" : "") + "_icon")
    },
    clearMarkers: function(a, c) {
        var b = [];
        if (!Ext.isArray(a)) {
            a = [a]
        }
        Ide.markerGrid.store.each(function(d) {
            if ((!c || d.get("cardId") == c.id) && Wb.indexOf(a, d.get("path")) != -1) {
                b.push(d)
            }
        });
        Ide.markerGrid.store.remove(b)
    },
    getMarkers: function(h, j, e) {
        var d = [],
            c, b, a, g, i, f;
        if (h.state) {
            c = h.state.lint;
            if (c && c.marked) {
                g = -1;
                f = -1;
                Wb.each(c.marked, function(k) {
                    b = k.__annotation;
                    a = b.from.line;
                    i = b.from.ch;
                    if (g != a || i != f) {
                        d.push({
                            message: b.message,
                            path: j,
                            line: a + 1,
                            ch: b.from.ch,
                            type: b.severity,
                            cardId: e ? e.id : ""
                        })
                    }
                    g = a;
                    f = i
                })
            }
        }
        Ide.markerGrid.store.loadData(d, true);
        if (d.length > 0) {
            Wb.highlight(Ide.markerGrid.tab.btnEl)
        }
    },
    toggleView: function(b, c) {
        Ide.utilView.setVisible(c)
    },
    searchFile: function() {
        Ide.doSearchFile()
    },
    doSearchFile: function(a) {
        var b = Ide.fileTree.getDockedComponent("searchBar"),
            c = !a || !b.isVisible();
        b.setVisible(c);
        if (c) {
            b.getComponent("combo").focus(false, true)
        }
    },
    selectPath: function(b) {
        var a;
        b = b || "";
        if (Ext.String.startsWith(b, "m?xwl=")) {
            b = Ide.modulePath + b.substring(6) + ".xwl"
        }
        b = b.replace(/\\/g, "/");
        if (Ide.isChild(b, Ide.modulePath)) {
            a = Ide.modNode
        } else {
            if (Ide.isChild(b, Ide.webPath)) {
                a = Ide.appNode
            } else {
                b = "/Root/" + Ide.sysNode.get("text") + "/" + Ide.getPathText(b);
                b = b.split("/");
                b[3] = b[3] + "/";
                Ide.fileTree.selectPath(b.join("\n"), "text", "\n");
                return
            }
        }
        Ide.fileTree.selectPath("/Root/" + a.get("text") + "/" + Ide.getPathText(b), "text")
    },
    getNode: function(c) {
        var b = Ide.activeCard,
            a;
        if (!b || b.cardType != "module" || b.getActiveTab().itemId != "designCard" || (a = b.tree.getSelection()).length === 0) {
            return null
        }
        return c ? a : a[0]
    },
    clearCoord: function() {
        var a = Ide.getNode(true),
            b;
        if (!a) {
            Wb.warn("请在模块对象视图中选择至少1个节点。");
            return
        }
        Wb.each(a, function(c) {
            b = c.data.configs;
            delete b.x;
            delete b.y;
            delete b.width;
            delete b.height
        });
        Ide.refreshGrid();
        Ide.setModified()
    },
    batchUpdate: function() {
        var a = Ide.getNode(true);
        if (!a) {
            Wb.warn("请在对象视图中选择至少1个节点。");
            return
        }
        Wb.prompt({
            title: "批量属性设置",
            width: 600,
            autoScroll: false,
            layout: {
                type: "vbox",
                align: "stretch"
            },
            defaults: {
                xtype: "textarea",
                labelWidth: 60,
                flex: 1
            },
            items: [{
                fieldLabel: "配置项",
                itemId: "configs"
            }, {
                fieldLabel: "事件",
                itemId: "events"
            }],
            handler: function(b, g) {
                var f, c;
                try {
                    if (b.configs) {
                        f = Wb.decode(b.configs)
                    }
                    if (b.events) {
                        c = Wb.decode(b.events)
                    }
                } catch (d) {
                    Wb.warn("配置项/事件中存在无效的值。");
                    return
                }
                Ide.doBatchUpdate(a, f, c);
                g.close()
            }
        })
    },
    doBatchUpdate: function(a, e, c) {
        var b, d;
        Wb.each(a, function(f) {
            d = Ide.getMetaControl(f).data;
            if (e) {
                Wb.each(e, function(g, h) {
                    if (d.configs[g]) {
                        f.data.configs[g] = h.toString();
                        b = true
                    }
                })
            }
            if (c) {
                if (!f.data.events) {
                    f.data.events = {}
                }
                Wb.each(c, function(g, h) {
                    if (d.events && d.events[g]) {
                        f.data.events[g] = h.toString();
                        b = true
                    }
                })
            }
        });
        Ide.refreshGrid();
        if (b) {
            Ide.setModified()
        }
    },
    setLabelAlign: function(a, b) {
        if (a instanceof Ext.form.field.Base || a instanceof Ext.form.FieldContainer) {
            if (b == "left") {
                a.labelAlign = b;
                a.labelEl.removeCls("x-form-item-label-right")
            } else {
                if (b == "right") {
                    a.labelAlign = b;
                    a.labelEl.addCls("x-form-item-label-right")
                }
            }
        } else {
            a.labelAlign = b;
            a.el.setStyle("text-align", b)
        }
    },
    setFieldAlign: function(e) {
        var a, c, b, g, f, h = e.alignValue,
            d = Ide.activeCard;
        if (d && d.cardType == "module") {
            d = d.getActiveTab()
        }
        if (d && (d.layoutCard || d.itemId == "designCard")) {
            if (d.layoutCard) {
                d.designer.items.each(function(i) {
                    if (i.isSelected) {
                        c = i.bindComp;
                        f = c instanceof Ext.form.field.Base || c instanceof Ext.form.FieldContainer;
                        if (f || c instanceof Ext.form.Label) {
                            if (!a) {
                                a = true
                            }
                            if (f && h == "center") {
                                b = true
                            } else {
                                Ide.setLabelAlign(c, h)
                            }
                        }
                    }
                })
            } else {
                Wb.each(Ide.activeCard.tree.getSelection(), function(i) {
                    g = Ide.getMetaControl(i);
                    if (g.data.configs.labelAlign) {
                        if (!a) {
                            a = true
                        }
                        if (g.data.id != "label" && h == "center") {
                            b = true
                        } else {
                            i.data.configs.labelAlign = h == "left" ? "" : h
                        }
                    }
                });
                Ide.refreshGrid()
            }
        }
        e.ownerCt.ownerCt.hide();
        if (b) {
            Wb.warn("居中只对标签控件有效。")
        }
        if (a) {
            Ide.setModified()
        } else {
            Wb.warn("操作无任何效果。")
        }
    },
    exportFile: function(a) {
        var b = app.getSelFiles();
        if (!b) {
            return
        }
        Wb.download("download", {
            files: b,
            zip: a
        })
    },
    importFile: function(a) {
        var c, b = Ide.fileTree.getSelection()[0];
        if (!b) {
            Wb.warn("请选择1个导入的目标目录。");
            return
        }
        b = b.isLeaf() ? b.parentNode : b;
        c = Ide.getPath(b);
        Wb.run({
            url: "upload-dialog",
            single: true,
            success: function(d) {
                Wb.highlight(b);
                d.upload({
                    url: "upload",
                    iconCls: "import_icon",
                    title: (a ? "导入到选择目录并解压 - " : "导入到选择目录 - ") + b.data.text,
                    params: {
                        path: c,
                        sync: true,
                        unzip: a
                    },
                    beforeUpload: a ? function() {
                        if (!Ext.String.endsWith(d.file.getValue().toLowerCase(), ".zip")) {
                            Wb.warn("请选择1个 zip 格式的文件。");
                            return false
                        }
                    } : null,
                    success: function() {
                        Wb.reload(Ide.fileTree)
                    }
                })
            }
        })
    },
    fillForm: function() {
        var a = Ext.WindowManager.getActive();
        if (a instanceof Ext.container.Container) {
            Ide.fillData(a)
        } else {
            if (Ide.activeCard && Ide.activeCard.bindFile) {
                Ide.fillData(Ide.activeCard)
            }
        }
    },
    fillData: function(a) {
        Ext.suspendLayouts();
        var c = 1,
            b = 1;
        a.items.each(function(d) {
            if (!d.disabled && !d.readOnly && d.isVisible && d.isVisible()) {
                if (d instanceof Ext.form.field.Checkbox) {
                    d.setValue(true)
                } else {
                    if (d instanceof Ext.form.field.Date || d instanceof Ext.form.field.Time || d instanceof Ext.form.field.Datetime) {
                        d.setValue(new Date())
                    } else {
                        if (d instanceof Ext.form.field.ComboBox) {
                            if (d.store && d.valueField && d.store.getCount() > 0) {
                                d.setValue(d.store.getAt(0).get(d.valueField))
                            } else {
                                d.setValue("v" + (c++))
                            }
                        } else {
                            if (d instanceof Ext.form.field.Number) {
                                d.setValue(b++)
                            } else {
                                if (d instanceof Ext.form.field.Text && !(d instanceof Ext.form.field.File)) {
                                    if (d.vtype == "email") {
                                        d.setValue("v" + (c++) + "@d.com")
                                    } else {
                                        if (d.vtype == "url") {
                                            d.setValue("http://www.v" + (c++) + ".com")
                                        } else {
                                            if (d.minLength) {
                                                d.setValue(Ext.String.repeat("a", d.minLength))
                                            } else {
                                                d.setValue("v" + (c++))
                                            }
                                        }
                                    }
                                } else {
                                    if (d instanceof Ext.container.Container) {
                                        Ide.fillData(d)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        Ext.resumeLayouts(true)
    },
    setAlign: function(c) {
        var f = Ide.activeCard;
        if (f && f.cardType == "module") {
            f = f.getActiveTab()
        }
        if (!f || !f.layoutCard) {
            Wb.warn("请在布局设计器中选择需要对齐的控件。");
            return
        }
        var j = c.type,
            o, r, n, z, t = f.designer,
            i, d, C, A = null,
            y = null,
            s = null,
            k = t.getWidth(),
            e, g, D = false,
            b, m, l, x = null,
            a = null,
            B = null,
            q = t.getHeight() - (t.header ? t.header.getHeight() : 0);
        t.items.each(function(h) {
            if (h.isSelected) {
                r = h.getLocalXY();
                n = h.getWidth();
                z = h.getHeight();
                i = r[0];
                if (A === null || i < A) {
                    A = i
                }
                d = r[0] + n;
                if (y === null || d > y) {
                    y = d
                }
                C = n;
                if (s === null || C > s) {
                    s = C
                }
                b = r[1];
                if (x === null || b < x) {
                    x = b
                }
                m = r[1] + z;
                if (a === null || m > a) {
                    a = m
                }
                l = z;
                if (B === null || l > B) {
                    B = l
                }
            }
        });
        e = (k - y + A) / 2 - A;
        g = (q - a + x) / 2 - x;
        t.items.each(function(h) {
            if (h.isSelected) {
                D = true;
                r = h.bindComp;
                n = h.getLocalXY();
                switch (j) {
                    case 1:
                        o = Ext.Number.snap(A, 8);
                        h.setLocalX(o);
                        r.setLocalX(o);
                        break;
                    case 2:
                        o = Ext.Number.snap(A + (s - h.getWidth()) / 2, 8);
                        h.setLocalX(o);
                        r.setLocalX(o);
                        break;
                    case 3:
                        o = Ext.Number.snap(n[0] + e, 8);
                        h.setLocalX(o);
                        r.setLocalX(o);
                        break;
                    case 4:
                        o = Ext.Number.snap(y - h.getWidth(), 8);
                        h.setLocalX(o);
                        r.setLocalX(o);
                        break;
                    case 5:
                        o = Ext.Number.snap(x, 8);
                        h.setLocalY(o);
                        r.setLocalY(o);
                        break;
                    case 6:
                        o = Ext.Number.snap(x + (B - h.getHeight()) / 2, 8);
                        h.setLocalY(o);
                        r.setLocalY(o);
                        break;
                    case 7:
                        o = Ext.Number.snap(n[1] + g, 8);
                        h.setLocalY(o);
                        r.setLocalY(o);
                        break;
                    case 8:
                        o = Ext.Number.snap(a - h.getHeight(), 8);
                        h.setLocalY(o);
                        r.setLocalY(o);
                        break
                }
            }
        });
        c.ownerCt.ownerCt.hide();
        if (D) {
            Ide.setModified()
        }
    },
    getPack: function(a) {
        Wb.request({
            url: "builder?xwl=dev/ide/get-pack",
            params: {
                type: a
            },
            timeout: -1,
            success: function(b) {
                Wb.info("已经成功在目录 “" + b.responseText + "” 生成软件包。")
            }
        })
    },
    createView: function() {
        new Ext.container.Viewport({
            layout: "border",
            listeners: {
                afterrender: {
                    single: true,
                    fn: function(a) {
                        Wb.getRefer(a, Ide)
                    }
                }
            },
            items: [{
                xtype: "toolbar",
                region: "north",
                border: false,
                enableOverflow: true,
                weight: 90,
                items: [{
                    text: "文件",
                    menu: {
                        minWidth: 220,
                        items: [{
                            text: '打开选择的文件<span class="wb_right">Ctrl+O</span>',
                            iconCls: "open_icon",
                            handler: Ide.open
                        }, "-", {
                            text: "导入模块包...",
                            iconCls: "import_icon",
                            handler: function() {
                                Ide.importModules()
                            }
                        }, {
                            text: "导出模块包...",
                            iconCls: "export_icon",
                            handler: function() {
                                Ide.exportModules()
                            }
                        }, "-", {
                            text: "导入到选择目录...",
                            handler: function() {
                                Ide.importFile()
                            }
                        }, {
                            text: "导入到选择目录并解压...",
                            handler: function() {
                                Ide.importFile(true)
                            }
                        }, {
                            text: "导出选择文件",
                            handler: function() {
                                Ide.exportFile()
                            }
                        }, {
                            text: "导出选择文件并压缩",
                            handler: function() {
                                Ide.exportFile(true)
                            }
                        }, "-", {
                            text: "检出...",
                            iconCls: "check_out_icon",
                            handler: app.checkOut
                        }, {
                            text: "检入...",
                            iconCls: "check_in_icon",
                            handler: app.checkIn
                        }, {
                            text: "版本文件管理",
                            iconCls: "file_edit_icon",
                            handler: function() {
                                Wb.open({
                                    url: "builder?xwl=dev/ide/version/version-mng",
                                    title: "版本文件管理",
                                    iconCls: "file_edit_icon"
                                })
                            }
                        }, "-", {
                            text: "关闭模块全部标签页",
                            type: 1,
                            handler: Ide.closeInnerTab
                        }, {
                            text: "关闭模块其他标签页",
                            type: 2,
                            handler: Ide.closeInnerTab
                        }, "-", {
                            text: "关闭全部文件",
                            handler: Ide.closeAll
                        }, {
                            text: "关闭其他文件",
                            handler: Ide.closeOthers
                        }]
                    }
                }, {
                    text: "编辑",
                    menu: {
                        minWidth: 220,
                        listeners: {
                            show: function() {
                                var a = !Ide.getEditor();
                                var b = ["addBookmarkBtn", "delBookmarkBtn", "insertFnNoteBtn", "insertPropNoteBtn", "insertTodoBtn", "insertAjaxBtn", "addAppBtn"];
                                Wb.each(b, function(c) {
                                    Ide[c].setDisabled(a)
                                })
                            }
                        },
                        items: [{
                            text: '剪切<span class="wb_right">Ctrl+X</span>',
                            iconCls: "cut_icon",
                            handler: Ide.cut
                        }, {
                            text: '复制<span class="wb_right">Ctrl+C</span>',
                            iconCls: "copy_icon",
                            handler: Ide.copy
                        }, {
                            text: '粘贴<span class="wb_right">Ctrl[+Shift]+V</span>',
                            iconCls: "paste_icon",
                            handler: Ide.paste
                        }, {
                            text: '删除<span class="wb_right">Ctrl+Shift+X|Delete</span>',
                            iconCls: "delete_icon",
                            handler: Ide.remove
                        }, "-", {
                            text: '添加书签<span class="wb_right">Ctrl+M</span>',
                            itemId: "addBookmarkBtn",
                            handler: Ide.addBookmark
                        }, {
                            text: "删除所有书签",
                            itemId: "delBookmarkBtn",
                            handler: Ide.clearBookmark
                        }, "-", {
                            text: '插入函数注释<span class="wb_right">Ctrl+1</span>',
                            itemId: "insertFnNoteBtn",
                            handler: Ide.addFuncNote
                        }, {
                            text: '插入属性注释<span class="wb_right">Ctrl+2</span>',
                            itemId: "insertPropNoteBtn",
                            handler: Ide.addPropertyNote
                        }, {
                            text: '插入 TODO<span class="wb_right">Ctrl+3</span>',
                            itemId: "insertTodoBtn",
                            handler: Ide.addTodo
                        }, {
                            text: '插入 Wb.request<span class="wb_right">Ctrl+4</span>',
                            itemId: "insertAjaxBtn",
                            handler: Ide.addWbRequest
                        }, {
                            text: '插入 app<span class="wb_right">Ctrl+Shift+1</span>',
                            itemId: "addAppBtn",
                            handler: Ide.addAppTpl
                        }]
                    }
                }, {
                    text: "查看",
                    menu: {
                        minWidth: 180,
                        items: [{
                            text: "外观",
                            hideOnClick: false,
                            menu: {
                                listeners: {
                                    show: function() {
                                        Ide[Wb.theme + "Btn"].setChecked(true)
                                    }
                                },
                                items: [{
                                    text: "经典",
                                    checked: false,
                                    itemId: "classicBtn",
                                    group: "theme",
                                    handler: Ide.setTheme
                                }, {
                                    text: "灰色",
                                    checked: false,
                                    itemId: "grayBtn",
                                    group: "theme",
                                    handler: Ide.setTheme
                                }, {
                                    text: "海王星",
                                    checked: false,
                                    itemId: "neptuneBtn",
                                    group: "theme",
                                    handler: Ide.setTheme
                                }, {
                                    text: "现代",
                                    checked: false,
                                    itemId: "modernBtn",
                                    group: "theme",
                                    handler: Ide.setTheme
                                }]
                            }
                        }, {
                            text: "脚本编辑器",
                            hideOnClick: false,
                            menu: {
                                listeners: {
                                    show: function() {
                                        Ide[Wb.editTheme + "Theme"].setChecked(true)
                                    }
                                },
                                items: [{
                                    text: "默认",
                                    checked: false,
                                    itemId: "defaultTheme",
                                    group: "edit",
                                    handler: Ide.setEditTheme
                                }, {
                                    text: "Night",
                                    checked: false,
                                    itemId: "nightTheme",
                                    group: "edit",
                                    handler: Ide.setEditTheme
                                }, {
                                    text: "Blackboard",
                                    checked: false,
                                    itemId: "blackboardTheme",
                                    group: "edit",
                                    handler: Ide.setEditTheme
                                }, {
                                    text: "Eclipse",
                                    checked: false,
                                    itemId: "eclipseTheme",
                                    group: "edit",
                                    handler: Ide.setEditTheme
                                }, {
                                    text: "MBO",
                                    checked: false,
                                    itemId: "mboTheme",
                                    group: "edit",
                                    handler: Ide.setEditTheme
                                }, {
                                    text: "Rubyblue",
                                    checked: false,
                                    itemId: "rubyblueTheme",
                                    group: "edit",
                                    handler: Ide.setEditTheme
                                }]
                            }
                        }, {
                            text: "文件标题",
                            itemId: "useFileTitleBtn",
                            toggle: true,
                            checked: app.initParams.fileTitle,
                            handler: function(a) {
                                app.initParams.fileTitle = a.checked;
                                a.ownerCt.hide();
                                app.fileTree.view.refresh()
                            }
                        }]
                    }
                }, {
                    text: "搜索",
                    menu: {
                        minWidth: 220,
                        items: [{
                            text: '搜索文本...<span class="wb_right">Ctrl+H</span>',
                            iconCls: "textarea_icon",
                            handler: Ide.search
                        }, {
                            text: '重新搜索<span class="wb_right">Ctrl+Shift+H</span>',
                            handler: Ide.searchAgain
                        }, {
                            text: "替换...",
                            handler: Ide.replace
                        }, "-", {
                            text: "搜索文件...",
                            iconCls: "file_default_icon",
                            handler: function() {
                                Wb.prompt({
                                    title: "搜索文件",
                                    iconCls: "file_default_icon",
                                    items: [{
                                        xtype: "combo",
                                        fieldLabel: "文件名称",
                                        itemId: "query",
                                        saveKeyname: "sys.ide.find.fileList",
                                        pickKeyname: "sys.ide.find.fileList",
                                        store: []
                                    }, {
                                        xtype: "radiogroup",
                                        fieldLabel: "修改日期",
                                        itemId: "dateRange",
                                        saveKeyname: "sys.ide.find.lastModified",
                                        items: [{
                                            boxLabel: "全部",
                                            checked: true
                                        }, {
                                            boxLabel: "今天"
                                        }, {
                                            boxLabel: "昨天"
                                        }, {
                                            boxLabel: "指定"
                                        }, {
                                            xtype: "datefield",
                                            allowBlank: false,
                                            itemId: "modifyDate",
                                            disabled: true,
                                            saveKeyname: "sys.ide.find.specifyDate",
                                            width: 110
                                        }],
                                        listeners: {
                                            change: function(c, d) {
                                                var a = c.getComponent("modifyDate"),
                                                    b;
                                                a.setDisabled(d != 3);
                                                b = a.getValue();
                                                var e = "";
                                                switch (d) {
                                                    case 0:
                                                        e = "查询所有文件";
                                                        break;
                                                    case 1:
                                                        e = "查询今天修改的所有文件";
                                                        break;
                                                    case 2:
                                                        e = "查询从昨天到今天修改的所有文件";
                                                        break;
                                                    case 3:
                                                        e = "查询从指定日期到今天修改的所有文件";
                                                        break
                                                }
                                                c.nextSibling().setValue(e)
                                            }
                                        }
                                    }, {
                                        hideEmptyLabel: false,
                                        xtype: "displayfield",
                                        value: "查询所有文件"
                                    }],
                                    handler: function(a, c) {
                                        var b;
                                        switch (a.dateRange) {
                                            case 0:
                                                b = -1;
                                                break;
                                            case 1:
                                                b = Ext.Date.clearTime(new Date());
                                                break;
                                            case 2:
                                                b = Ext.Date.add(Ext.Date.clearTime(new Date()), Ext.Date.DAY, -1);
                                                break;
                                            case 3:
                                                b = a.modifyDate;
                                                break
                                        }
                                        Ide.searchGrid.store.load({
                                            params: {
                                                lastModified: b,
                                                searchType: "filelist",
                                                searchList: true,
                                                query: a.query
                                            },
                                            callback: function(e, d, f) {
                                                if (f) {
                                                    Ide.showSearch();
                                                    Ide.searchGrid.searched = true;
                                                    c.close()
                                                }
                                            }
                                        })
                                    }
                                })
                            }
                        }, {
                            text: '快速检索文件...<span class="wb_right">Ctrl+Shift+L</span>',
                            handler: Ide.searchFile
                        }, {
                            text: "搜索 TODO",
                            handler: Ide.searchTodo
                        }, {
                            text: "搜索重复模块",
                            handler: function() {
                                Ide.searchGrid.store.load({
                                    params: {
                                        searchType: "duplicate"
                                    },
                                    callback: function(d, c, e) {
                                        if (e) {
                                            Ide.showSearch();
                                            Ide.searchGrid.searched = true
                                        }
                                    }
                                })
                            }
                        }, {
                            text: "搜索隐患模块",
                            handler: function() {
                                Ide.searchGrid.store.load({
                                    params: {
                                        searchType: "bug"
                                    },
                                    callback: function(d, c, e) {
                                        if (e) {
                                            Ide.showSearch();
                                            Ide.searchGrid.searched = true
                                        }
                                    }
                                })
                            }
                        }, {
                            text: "搜索 URL 捷径...",
                            handler: function() {
                                Wb.prompt({
                                    title: "搜索 URL 捷径",
                                    iconCls: "search_icon",
                                    items: [{
                                        xtype: "combo",
                                        fieldLabel: "URL 捷径",
                                        itemId: "shortcut",
                                        allowBlank: false,
                                        saveKeyname: "sys.ide.find.shortcut",
                                        pickKeyname: "sys.ide.find.shortcut",
                                        store: []
                                    }],
                                    handler: function(a, b) {
                                        Ide.searchGrid.store.load({
                                            params: {
                                                searchType: "shortcut",
                                                shortcut: a.shortcut
                                            },
                                            callback: function(d, c, e) {
                                                if (e) {
                                                    Ide.showSearch();
                                                    Ide.searchGrid.searched = true;
                                                    b.close()
                                                }
                                            }
                                        })
                                    }
                                })
                            }
                        }, {
                            text: '跳转到行...<span class="wb_right">Ctrl+5</span>',
                            handler: Ide.gotoLine
                        }]
                    }
                }, {
                    text: "设计",
                    menu: {
                        minWidth: 190,
                        items: [{
                            text: '布局设计器<span class="wb_right">Ctrl+B</span>',
                            iconCls: "window_icon",
                            handler: Ide.setLayout
                        }, {
                            text: '自动调整控件顺序<span class="wb_right">Ctrl+Shift+U</span>',
                            iconCls: "order_icon",
                            handler: Ide.adjustZIndex
                        }, {
                            text: "批量属性设置...",
                            handler: Ide.batchUpdate
                        }, {
                            text: "清除控件位置信息",
                            handler: Ide.clearCoord
                        }, {
                            text: "纸张大小设置...",
                            handler: Ide.setPaper
                        }, "-", {
                            text: 'SQL 生成器<span class="wb_right">Ctrl+Shift+B</span>',
                            iconCls: "sql_icon",
                            handler: Ide.setSQL
                        }, {
                            text: '自动填充表单<span class="wb_right">Ctrl+Shift+K</span>',
                            iconCls: "db_field_edit_icon",
                            handler: Ide.fillForm
                        }, "-", {
                            xtype: "buttongroup",
                            title: "文本对齐方式",
                            columns: 4,
                            defaults: {
                                xtype: "button",
                                iconAlign: "top",
                                text: " ",
                                handler: Ide.setFieldAlign,
                                width: 35
                            },
                            items: [{
                                tooltip: "左对齐",
                                alignValue: "left",
                                iconCls: "text_align_left_icon"
                            }, {
                                tooltip: "居中对齐",
                                alignValue: "center",
                                iconCls: "text_align_center_icon"
                            }, {
                                tooltip: "右对齐",
                                alignValue: "right",
                                iconCls: "text_align_right_icon"
                            }, {
                                itemId: "anchorRightBtn",
                                iconCls: "text_align_right_pin_icon",
                                enableToggle: true,
                                pressed: false,
                                handler: Ext.emptyFn,
                                tooltip: "新添加的控件文本锁定右对齐"
                            }]
                        }, {
                            xtype: "buttongroup",
                            title: "控件对齐方式",
                            columns: 4,
                            defaults: {
                                xtype: "button",
                                scale: "large",
                                width: 35,
                                handler: Ide.setAlign
                            },
                            items: [{
                                iconCls: "ide_h1",
                                tooltip: "左对齐",
                                type: 1
                            }, {
                                iconCls: "ide_h2",
                                tooltip: "水平居中对齐",
                                type: 2
                            }, {
                                iconCls: "ide_h3",
                                tooltip: "容器内水平居中对齐",
                                type: 3
                            }, {
                                iconCls: "ide_h4",
                                tooltip: "右对齐",
                                type: 4
                            }, {
                                iconCls: "ide_v1",
                                tooltip: "顶部对齐",
                                type: 5
                            }, {
                                iconCls: "ide_v2",
                                tooltip: "垂直居中对齐",
                                type: 6
                            }, {
                                iconCls: "ide_v3",
                                tooltip: "容器内垂直居中对齐",
                                type: 7
                            }, {
                                iconCls: "ide_v4",
                                tooltip: "底部对齐",
                                type: 8
                            }]
                        }]
                    }
                }, {
                    text: "工具",
                    menu: {
                        minWidth: 180,
                        items: [{
                            text: "数据库浏览器",
                            iconCls: "db_icon",
                            handler: function() {
                                Wb.open({
                                    url: "dbe",
                                    title: "数据库浏览器",
                                    iconCls: "db_icon"
                                })
                            }
                        }, {
                            text: "文件管理器",
                            iconCls: "explorer_icon",
                            handler: function() {
                                Wb.open({
                                    url: "file",
                                    title: "文件管理器",
                                    iconCls: "explorer_icon"
                                })
                            }
                        }, {
                            text: "键值编辑器",
                            iconCls: "dp_icon",
                            handler: function() {
                                Wb.open({
                                    url: "kve",
                                    title: "键值编辑器",
                                    iconCls: "dp_icon"
                                })
                            }
                        }, {
                            text: "数据字典",
                            iconCls: "book_icon",
                            handler: function() {
                                Wb.open({
                                    url: "dict",
                                    title: "数据字典",
                                    iconCls: "book_icon"
                                })
                            }
                        }, "-", {
                            text: "生成软件包",
                            menu: {
                                items: [{
                                    text: "演示版本",
                                    itemId: "getRelPackBtn",
                                    handler: function() {
                                        if (Ide.versionType != "x") {
                                            Ide.getPack("r")
                                        } else {
                                            Ide.getPack("d")
                                        }
                                    }
                                }, {
                                    text: "企业版本 (简化版)",
                                    itemId: "getStdPackBtn",
                                    handler: function() {
                                        Ide.getPack("s")
                                    }
                                }, {
                                    text: "企业版本 (完全版)",
                                    itemId: "getEntPackBtn",
                                    handler: function() {
                                        Ide.getPack("e")
                                    }
                                }]
                            }
                        }, {
                            text: "压缩 JS/CSS 文件",
                            iconCls: "file_zip_icon",
                            handler: function() {
                                Wb.choose("确定要压缩应用目录下以“-debug”结尾的所有调试文件吗？<br>警告：压缩生成的新文件名为去除“-debug”的文件名，如果文件存在将被覆盖。<br>[是]：压缩所有文件，[否]：压缩修改过的文件，[取消]：取消操作。", function(a) {
                                    if (a != "cancel") {
                                        Wb.request({
                                            url: "builder?xwl=dev/ide/compress",
                                            params: {
                                                compressAll: a == "yes"
                                            },
                                            timeout: -1,
                                            success: function() {
                                                Wb.info("所有文件已经压缩完成。")
                                            }
                                        })
                                    }
                                })
                            }
                        }, {
                            text: "刷新系统",
                            iconCls: "start_icon",
                            handler: function() {
                                Wb.request({
                                    url: "builder?xwl=dev/ide/reload",
                                    success: function() {
                                        Wb.tip("已经成功刷新系统。")
                                    }
                                })
                            }
                        }]
                    }
                }, "-", {
                    tooltip: "添加文件 (Ctrl+J)",
                    overflowText: "添加文件",
                    iconCls: "file_add_icon",
                    handler: Ide.add,
                    xtype: "splitbutton",
                    menu: {
                        items: [{
                            text: "模块文件...",
                            handler: app.add
                        }, {
                            text: "增删改查框架...",
                            handler: app.createCRUDFrame
                        }, {
                            text: "主页面框架...",
                            handler: app.createMainFrame
                        }, {
                            text: "公共对话框框架...",
                            handler: app.createDialogFrame
                        }]
                    }
                }, {
                    tooltip: "添加目录 (Ctrl+Shift+J)",
                    overflowText: "添加目录",
                    iconCls: "folder_add_icon",
                    handler: Ide.addFolder
                }, {
                    tooltip: "属性 (Ctrl+U)",
                    overflowText: "属性",
                    iconCls: "property_icon",
                    handler: Ide.setProperty
                }, {
                    tooltip: "布局设计器 (Ctrl+B)",
                    overflowText: "布局设计器",
                    itemId: "layoutBtn",
                    iconCls: "window_icon",
                    handler: Ide.setLayout
                }, {
                    itemId: "runBtn",
                    tooltip: "保存当前模块并运行 (Ctrl+Q)",
                    overflowText: "保存当前模块并运行",
                    iconCls: "run_icon",
                    handler: Ide.run
                }, "-", {
                    itemId: "saveBtn",
                    tooltip: "保存 (Ctrl+S)",
                    overflowText: "保存",
                    iconCls: "save_icon",
                    handler: Ide.save
                }, {
                    itemId: "saveAllBtn",
                    tooltip: "保存全部 (Ctrl+Shift+S)",
                    overflowText: "保存全部",
                    iconCls: "save_all_icon",
                    handler: Ide.saveAll
                }, "-", {
                    tooltip: "后退 (Ctrl+9)",
                    overflowText: "后退",
                    iconCls: "left_icon",
                    handler: Ide.back
                }, {
                    tooltip: "前进 (Ctrl+0)",
                    overflowText: "前进",
                    iconCls: "right_icon",
                    handler: Ide.forward
                }, {
                    tooltip: "转到设计页面 (Ctrl+6)",
                    overflowText: "转到设计页面",
                    iconCls: "model_icon",
                    handler: Ide.toDesign
                }, {
                    tooltip: "切换文件/运行页面 (Ctrl+7)",
                    overflowText: "切换文件/运行页面",
                    iconCls: "set_icon",
                    handler: Ide.toggleRun
                }, {
                    tooltip: "切换属性/脚本编辑器 (Ctrl+8)",
                    overflowText: "切换属性/脚本编辑器",
                    iconCls: "move_icon",
                    handler: Ide.toggleEditor
                }, "-", {
                    tooltip: "显示/隐藏多功能视图 (Ctrl+Shift+I)",
                    overflowText: "显示/隐藏多功能视图",
                    itemId: "toggleViewBtn",
                    iconCls: "view_icon",
                    enableToggle: true,
                    listeners: {
                        toggle: Ide.toggleView
                    }
                }, {
                    tooltip: "服务端信息显示在控制台 (Ctrl+I)",
                    overflowText: "服务端信息显示在控制台",
                    itemId: "toggleOutputsBtn",
                    iconCls: "console_icon",
                    enableToggle: true,
                    pressed: true,
                    listeners: {
                        toggle: function(b, c) {
                            if (c) {
                                Ide.msgSocket.open()
                            } else {
                                Ide.msgSocket.close()
                            }
                        }
                    }
                }, "->", {
                    text: "主卡",
                    menu: {
                        items: [{
                            text: ""
                        }],
                        listeners: {
                            beforeshow: function(b) {
                                var a = [];
                                Ide.fileTab.items.each(function(c) {
                                    a.push({
                                        iconCls: c.iconCls,
                                        icon: c.icon,
                                        text: c.title,
                                        noStarText: Ext.String.startsWith(c.title, "*") ? c.title.substring(1) : c.title,
                                        cardId: c.id,
                                        tooltip: c.title == c.tab.tooltip ? "" : c.tab.tooltip
                                    })
                                });
                                b.removeAll(true);
                                if (a.length === 0) {
                                    a.push({
                                        text: "(无)"
                                    })
                                }
                                Wb.sort(a, "noStarText");
                                b.add(a)
                            },
                            click: function(b, a) {
                                if (a.cardId) {
                                    Ide.fileTab.setActiveTab(Ext.getCmp(a.cardId))
                                }
                            }
                        }
                    }
                }, {
                    text: "子卡",
                    menu: {
                        items: [{
                            text: ""
                        }],
                        listeners: {
                            beforeshow: function(b) {
                                var a = [];
                                if (Ide.activeCard && Ide.activeCard instanceof Ext.tab.Panel) {
                                    Ide.activeCard.items.each(function(c) {
                                        a.push({
                                            iconCls: c.iconCls,
                                            icon: c.icon,
                                            text: c.title,
                                            cardId: c.id,
                                            tooltip: c.title == c.tab.tooltip ? "" : c.tab.tooltip
                                        })
                                    })
                                }
                                b.removeAll(true);
                                if (a.length === 0) {
                                    a.push({
                                        text: "(无)"
                                    })
                                }
                                Wb.sort(a, "text");
                                b.add(a)
                            },
                            click: function(b, a) {
                                if (a.cardId) {
                                    Ide.activeCard.setActiveTab(Ext.getCmp(a.cardId))
                                }
                            }
                        }
                    }
                }]
            }, {
                itemId: "fileTree",
                xtype: "treepanel",
                title: "文件列表",
                iconCls: "explorer_icon",
                region: "west",
                weight: 30,
                rootVisible: false,
                multiSelect: true,
                width: 230,
                split: true,
                collapsible: true,
                hideHeaders: true,
                cls: "x-autowidth-table",
                popupMenu: {
                    xtype: "menu",
                    minWidth: 200,
                    items: [{
                        text: "添加文件...<span class='wb_right'>Ctrl+J</span>",
                        iconCls: "file_add_icon",
                        handler: app.add
                    }, {
                        text: "添加目录...<span class='wb_right'>Ctrl+Shift+J</span>",
                        iconCls: "folder_add_icon",
                        handler: app.addFolder
                    }, "-", {
                        text: "检出...",
                        iconCls: "check_out_icon",
                        handler: app.checkOut
                    }, {
                        text: "检入...",
                        iconCls: "check_in_icon",
                        handler: app.checkIn
                    }, "-", {
                        text: "添加框架模块",
                        menu: {
                            items: [{
                                text: "增删改查...",
                                handler: app.createCRUDFrame
                            }, {
                                text: "主页面...",
                                handler: app.createMainFrame
                            }, {
                                text: "公共对话框...",
                                handler: app.createDialogFrame
                            }]
                        }
                    }, "-", {
                        text: "剪切<span class='wb_right'>Ctrl+X</span>",
                        iconCls: "cut_icon",
                        handler: app.cut
                    }, {
                        text: "复制<span class='wb_right'>Ctrl+C</span>",
                        iconCls: "copy_icon",
                        handler: app.copy
                    }, {
                        text: "粘贴<span class='wb_right'>Ctrl+V</span>",
                        iconCls: "paste_icon",
                        handler: app.paste
                    }, {
                        text: "删除<span class='wb_right'>Delete</span>",
                        iconCls: "delete_icon",
                        handler: app.remove
                    }]
                },
                columns: [{
                    xtype: "treecolumn",
                    dataIndex: "text",
                    width: Ext.isIE6 ? "100%" : 10000,
                    renderer: function(b, c, a) {
                        var d = a.data.title;
                        b = Wb.encodeHtml(b);
                        if (app.initParams.fileTitle && d) {
                            return b + '&nbsp;&nbsp;<span style="color:#999;">' + Wb.encodeHtml(d) + "</span>"
                        } else {
                            return b
                        }
                    }
                }],
                tbar: {
                    itemId: "searchBar",
                    hidden: true,
                    items: [{
                        itemId: "combo",
                        xtype: "combobox",
                        displayField: "name",
                        valueField: "path",
                        triggerAction: "last",
                        triggerCls: "x-form-search-trigger",
                        onTriggerClick: function() {
                            var a = this.getValue();
                            if (a) {
                                Ide.selectPath(a)
                            }
                        },
                        flex: 1,
                        listConfig: {
                            itemTpl: ["<div>{text}</div>"]
                        },
                        store: {
                            url: "builder?xwl=dev/ide/search-file",
                            fields: ["path", {
                                name: "text",
                                convert: function(a, b) {
                                    return Ide.getPathText(b.data.path)
                                }
                            }, {
                                name: "name",
                                convert: function(a, b) {
                                    return Wb.getFilename(b.data.path)
                                }
                            }]
                        },
                        listeners: {
                            beforequery: function(a) {
                                if (a.query.indexOf("/") != -1 || a.query.indexOf("\\") != -1) {
                                    a.combo.collapse();
                                    return false
                                }
                            },
                            select: function(b, c) {
                                Ide.doOpen(c[0].data.path, function(a) {
                                    if (a.editor) {
                                        a.editor.focus()
                                    }
                                })
                            },
                            specialkey: function(a, b) {
                                if (b.getKey() == b.ENTER && !a.isExpanded) {
                                    Ide.selectPath(a.getValue())
                                }
                            }
                        }
                    }]
                },
                tools: [{
                    type: "refresh",
                    tooltip: "刷新",
                    callback: function() {
                        Wb.reload(Ide.fileTree)
                    }
                }, {
                    type: "search",
                    tooltip: "显示/隐藏搜索框",
                    callback: function() {
                        Ide.doSearchFile(true)
                    }
                }],
                store: {
                    url: "builder?xwl=dev/ide/get-tree",
                    fields: ["base", "text", "type", "title", "hidden", "inframe", "pageLink"],
                    listeners: {
                        beforeload: function(b, a) {
                            var c = a.node;
                            Ext.apply(a.params, {
                                path: Ide.getPath(c),
                                type: Wb.getNode(c, 1).data.type
                            })
                        },
                        success: function(b, c) {
                            if (c.isRoot()) {
                                var d = c.firstChild;
                                Ide.modulePath = d.data.base;
                                //Ide.webPath = d.nextSibling.data.base;
                                Ide.modNode = d;
                                //Ide.appNode = d.nextSibling;
                                //Ide.sysNode = Ide.appNode.nextSibling
                            }
                        }
                    }
                },
                viewConfig: {
                    plugins: {
                        ptype: "treeviewdragdrop",
                        ddGroup: "file"
                    },
                    listeners: {
                        beforedrop: function(d, f, b, g, e) {
                            var a = Wb.reverse(f.records),
                                c = [];
                            Wb.each(a, function(h) {
                                c.push(Ide.getPath(h))
                            });
                            e.wait = true;
                            Wb.request({
                                url: "builder?xwl=dev/ide/move",
                                timeout: -1,
                                params: {
                                    src: Wb.encode(c),
                                    dst: Ide.getPath(b),
                                    dropPosition: g,
                                    type: Wb.getNode(b, 1).data.type
                                },
                                callback: function(j, h, k) {
                                    function l() {
                                        Ide.syncFiles(a);
                                        Ide.syncData(Wb.decode(k.responseText));
                                        Ide.fileTree.setSelection(a)
                                    }
                                    if (h) {
                                        Ide.setOldPath(a);
                                        if (g == "append" && !b.isLoaded()) {
                                            var i = [];
                                            e.cancelDrop();
                                            Wb.each(a, function(m) {
                                                i.push([m.data.text, Ide.getPath(m)])
                                            });
                                            Wb.remove(a);
                                            b.expand(false, function() {
                                                a = [];
                                                Wb.each(i, function(n) {
                                                    var m = b.findChild("text", n[0]);
                                                    m.data.oldPath = n[1];
                                                    a.push(m)
                                                });
                                                l()
                                            })
                                        } else {
                                            e.processDrop();
                                            l()
                                        }
                                    } else {
                                        e.cancelDrop()
                                    }
                                }
                            })
                        },
                        nodedragover: function(e, h, f) {
                            var c, g, d, b = e.parentNode,
                                a = Wb.getNode(e, 1).data.type != "module";
                            Wb.each(f.records, function(i) {
                                if (i.getDepth() == 1) {
                                    c = true;
                                    return false
                                }
                                if (i.getDepth() == 2 && Wb.getNode(i, 1).data.type == "file") {
                                    g = true;
                                    return false
                                }
                                if (i.parentNode == b) {
                                    d = true;
                                    return false
                                }
                            });
                            if (c || g || e.getDepth() == 1 && h != "append" || a && d && h != "append") {
                                return false
                            }
                        }
                    }
                },
                listeners: {
                    itemkeydown: Wb.mimicClick,
                    itemdblclick: function(b, a, d, c, f) {
                        if (a.isLeaf()) {
                            if (f.ctrlKey) {
                                var g = Ide.getNodeUrl(a);
                                if (g) {
                                    Ide.insertText(g)
                                }
                            } else {
                                Ide.open()
                            }
                        }
                    }
                }
            }, {
                xtype: "tabpanel",
                region: "center",
                itemId: "fileTab",
                deferredRender: false,
                closeOther: Ide.closeOthers,
                closeAll: Ide.closeAll,
                plugins: ["tabreorderer", "tabclosemenu"],
                listeners: {
                    afterrender: {
                        single: true,
                        fn: function(a) {
                            a.mon(a.tabBar.el, "dblclick", function(d, c) {
                                var b = Ide.activeCard;
                                if (b && b.bindFile && !b.hasParams && b.tab.el.isAncestor(c)) {
                                    if (Ext.String.endsWith(b.bindFile, ".xwl")) {
                                        window.open("builder?xwl=" + b.bindFile.slice(0, -4))
                                    } else {
                                        window.open(b.bindFile)
                                    }
                                }
                            }, a)
                        }
                    },
                    beforetabchange: function(b, a) {
                        var c;
                        if (a.cardType == "module") {
                            c = a.getActiveTab()
                        }
                        Ide.controlTree.setVisible(c && (c.itemId == "designCard" || c.layoutCard))
                    },
                    tabchange: function(b, a) {
                        Ide.activeCard = a;
                        Ide.activeScope = a.appScope;
                        Ide.setButtons();
                        Ide.recordActivity()
                    },
                    remove: function(a) {
                        if (a.items.length === 0) {
                            Ide.activeCard = null;
                            Ide.activeScope = null;
                            Ide.activeCmp = "file"
                        }
                        Ide.setButtons()
                    }
                }
            }, {
                region: "east",
                itemId: "controlTree",
                title: "控件箱",
                width: 160,
                tools: Wb.getTreeTools({
                    search: true,
                    expand: false,
                    collapse: false
                }),
                xtype: "treepanel",
                iconCls: "tool_icon",
                collapsible: true,
                rootVisible: false,
                split: true,
                ddGroup: "controlList",
                store: {
                    url: "builder?xwl=dev/cm/get-tree&type=ide",
                    fields: ["id", "text", "control", "type", "general", "configs", "events"],
                    listeners: {
                        success: function() {
                            Ide.moduleNode = Ide.controlTree.getRootNode().findChild("id", "module", true);
                            Ide.controlMap = {
                                module: Ide.moduleNode
                            };
                            Ide.moduleNode.remove();
                            Ide.controlTree.getRootNode().cascadeBy(function(a) {
                                if (a.data.control) {
                                    Ide.controlMap[a.data.id] = a
                                }
                            })
                        }
                    }
                },
                listeners: {
                    itemkeydown: Wb.mimicClick,
                    itemdblclick: function(d, a) {
                        var c, b = Ide.activeCard;
                        if (b && a.data.control && b.cardType == "module" && b.getActiveTab().layoutCard) {
                            c = b.getActiveTab().designer;
                            Ide.addDesignComp(c, a, c.body.dom.scrollLeft + 8, c.body.dom.scrollTop + 8)
                        } else {
                            Ide.addControl(a)
                        }
                    }
                },
                viewConfig: {
                    plugins: {
                        ptype: "treeviewdragdrop",
                        ddGroup: "controlList",
                        enableDrop: false
                    }
                }
            }, {
                region: "south",
                itemId: "utilView",
                xtype: "tabpanel",
                split: true,
                hidden: true,
                deferredRender: false,
                height: 120,
                listeners: {
                    afterrender: {
                        single: true,
                        fn: function(a) {
                            a.fireEvent("tabchange", a, a.items.items[0])
                        }
                    },
                    tabchange: function(b, a) {
                        var c = a.itemId;
                        Ext.suspendLayouts();
                        b.tabBar.items.each(function(d) {
                            if (!(d instanceof Ext.tab.Tab) && !d.ignoreItem) {
                                d.setVisible(d.belong === c || Wb.indexOf(d.belong, c) != -1)
                            }
                        });
                        Ext.resumeLayouts(true)
                    }
                },
                tabBar: {
                    defaultType: "button",
                    items: [{
                        xtype: "tbfill",
                        ignoreItem: true
                    }, {
                        tooltip: "刷新",
                        iconCls: "refresh_icon",
                        handler: function() {
                            var a = Ide.utilView.getActiveTab();
                            if (a == Ide.threadCard) {
                                app.refreshThread()
                            } else {
                                if (a == Ide.connCard) {
                                    app.refreshConnection()
                                } else {
                                    Ide.searchAgain()
                                }
                            }
                        },
                        belong: ["threadCard", "connCard", "searchGrid"]
                    }, {
                        tooltip: "清除",
                        iconCls: "file_delete_icon",
                        handler: function() {
                            var a = Ide.utilView.getActiveTab();
                            if (a == Ide.threadCard) {
                                Ide.threadCard.update("")
                            } else {
                                if (a == Ide.connCard) {
                                    Ide.connCard.update("")
                                } else {
                                    if (a.store) {
                                        a.store.removeAll()
                                    }
                                }
                            }
                        },
                        belong: "searchGrid",
                        ignoreItem: true
                    }, {
                        xtype: "tbspacer",
                        width: 8,
                        ignoreItem: true
                    }]
                },
                items: [{
                    itemId: "markerGrid",
                    title: "标记",
                    xtype: "grid",
                    pagingBar: false,
                    iconCls: "registration_icon",
                    store: {
                        fields: ["message", "type", "path", "line", "ch", "cardId"]
                    },
                    columns: [{
                        xtype: "rownumberer"
                    }, {
                        text: "内容",
                        dataIndex: "message",
                        flex: 2,
                        renderer: function(d, e, a) {
                            var c = a.get("type"),
                                b = {
                                    error: "error_icon",
                                    warning: "warning_icon"
                                };
                            return Wb.getIcon(b[c] || "info_icon") + Ext.htmlEncode(d)
                        }
                    }, {
                        text: "文件",
                        dataIndex: "path",
                        flex: 1,
                        renderer: function(a) {
                            return Ext.htmlEncode(Ide.getPathText(a))
                        }
                    }, {
                        text: "位置",
                        dataIndex: "line",
                        width: 70,
                        align: "right"
                    }, {
                        text: "类型",
                        dataIndex: "type",
                        width: 70
                    }],
                    listeners: {
                        itemkeydown: Wb.mimicClick,
                        itemdblclick: function(b, a) {
                            Ide.doOpen(a.get("path"), function(c) {
                                var d;
                                if (a.get("cardId")) {
                                    d = c.getComponent(a.get("cardId"));
                                    c.setActiveTab(d);
                                    c = d
                                }
                                c.editor.setCursor(a.get("line") - 1, a.get("ch"));
                                c.editor.focus()
                            })
                        }
                    }
                }, {
                    itemId: "searchGrid",
                    title: "搜索",
                    xtype: "grid",
                    plugins: {
                        ptype: "bufferedrenderer"
                    },
                    pagingBar: false,
                    iconCls: "search_icon",
                    store: {
                        url: "builder?xwl=dev/ide/search-text",
                        timeout: -1,
                        message: "正在搜索中，请稍候...",
                        listeners: {
                            success: function() {
                                Ide.utilView.setActiveTab(Ide.searchGrid)
                            }
                        },
                        fields: ["content", "path", "line", "ch", "nodePath", "itemName", {
                            name: "pathText",
                            convert: function(b, a) {
                                var c = Ide.getPathText(a.data.path);
                                if (Ext.String.endsWith(c, ".xwl")) {
                                    if (a.data.nodePath) {
                                        return c + "@" + Wb.getSection(a.data.nodePath, "/", 1)
                                    }
                                }
                                return c
                            }
                        }, {
                            name: "lastModified",
                            type: "date",
                            dateFormat: Wb.dateFormat
                        }]
                    },
                    columns: [{
                        xtype: "rownumberer"
                    }, {
                        text: "内容",
                        dataIndex: "content",
                        flex: 2,
                        defaultRenderer: false
                    }, {
                        text: "文件",
                        dataIndex: "pathText",
                        flex: 1
                    }, {
                        text: "位置",
                        dataIndex: "line",
                        width: 70,
                        align: "right"
                    }],
                    listeners: {
                        itemkeydown: Wb.mimicClick,
                        itemdblclick: function(b, a) {
                            var c, e, f = a.get("path"),
                                d = Wb.extractFileExt(f);
                            if (!f) {
                                return
                            }
                            Ide.doOpen(f, function(g) {
                                if (d == "xwl") {
                                    e = g.getActiveTab();
                                    if (e.node) {
                                        c = "/" + Wb.getSection(e.node.getPath("text"), "/", 2)
                                    } else {
                                        c = ""
                                    }
                                    if (g.path == a.data.path && c == a.data.nodePath && (e.itemType + "=" + e.itemName) == a.data.itemName) {
                                        e.editor.setCursor(a.data.line - 1, a.data.ch);
                                        e.editor.focus()
                                    } else {
                                        g.setActiveTab(g.designCard);
                                        if (a.data.nodePath) {
                                            g.tree.selectPath("/Root" + a.data.nodePath, "text", "/", function() {
                                                var k = Wb.namePart(a.data.itemName),
                                                    j = Wb.valuePart(a.data.itemName),
                                                    h = g.property.store,
                                                    i;
                                                i = h.findBy(function(l) {
                                                    return l.data.type == k && l.data.name == j
                                                });
                                                if (i != -1) {
                                                    setTimeout(function() {
                                                        g.property.editPlugin.startEdit(h.getAt(i), 1);
                                                        Ide.doEdit(true, a.get("line"), a.get("ch"))
                                                    }, 10)
                                                } else {
                                                    Wb.warn('没有找到 "' + j + '"。')
                                                }
                                            })
                                        }
                                    }
                                } else {
                                    g.editor.setCursor(a.get("line") - 1, a.get("ch"));
                                    setTimeout(function() {
                                        g.editor.scrollIntoView();
                                        g.editor.focus()
                                    }, 10)
                                }
                            })
                        }
                    }
                }, {
                    itemId: "connCard",
                    title: "连接",
                    xtype: "container",
                    iconCls: "db_icon",
                    autoScroll: true,
                    padding: "0 8 0 8",
                    listeners: {
                        activate: function() {
                            app.refreshConnection()
                        }
                    }
                }, {
                    itemId: "threadCard",
                    title: "线程",
                    xtype: "container",
                    iconCls: "execute_icon",
                    autoScroll: true,
                    padding: "0 8 0 8",
                    listeners: {
                        activate: function() {
                            app.refreshThread()
                        }
                    }
                }]
            }]
        })
    },
    launch: function(a) {
        sys.ide = Ide;
        app = Ide;
        app.initParams = Wb.decode(a) || {};
        Ide.init();
        Ide.addEvents();
        Ide.createView();
        Ide.activeCmp = "file";
        Ide.setButtons();
    }
};
