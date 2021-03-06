'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('TreeCtrl', ['$anchorScroll' , '$q', '$filter', '$location', '$uibModal', '$scope', '$state','$timeout', 'growl',
                          'UxService', 'ElementService', 'UtilsService', 'ViewService', 'ProjectService', 'MmsAppUtils', 'documentOb', 'viewOb',
                          'orgOb', 'projectOb', 'refOb', 'refObs', 'groupObs', 'docMeta', 'PermissionsService', 'RootScopeService', 'TreeService',
                          'EventService',
function($anchorScroll, $q, $filter, $location, $uibModal, $scope, $state, $timeout, growl,
    UxService, ElementService, UtilsService, ViewService, ProjectService, MmsAppUtils, documentOb, viewOb,
    orgOb, projectOb, refOb, refObs, groupObs, docMeta, PermissionsService, RootScopeService, TreeService, EventService) {

    //Register with the Session Service
    let rootScopeSvc = RootScopeService;
    let tree = TreeService;

    let eventSvc = EventService;
    eventSvc.$init($scope);

    $scope.filterInputPlaceholder = 'Filter groups/docs';
    if ($state.includes('project.ref.document')) {
        $scope.filterInputPlaceholder = 'Filter table of contents';
    }

    rootScopeSvc.mmsRefOb(refOb);

    $scope.bbApi = {};

    $scope.tbApi = {};

    $scope.treeApi = tree.getApi();
    $scope.treeData = tree.treeData;

    if (tree.treeData.length > 0) {
        tree.treeData.length = 0;
        tree.treeRows.length = 0;
    }

    rootScopeSvc.treePaneClosed($scope.$pane.closed);
    $scope.$watch($scope.$pane.closed,() => {
        rootScopeSvc.treePaneClosed($scope.$pane.closed);
    });

   $scope.subs.push(eventSvc.$on('tree-pane-toggle',(paneClosed) => {
       if (paneClosed === undefined) {
           $scope.$pane.toggle();
           rootScopeSvc.treePaneClosed($scope.$pane.closed);
       }
       else if (paneClosed && !$scope.$pane.closed) {
           $scope.$pane.toggle();
           rootScopeSvc.treePaneClosed($scope.$pane.closed);
       }
       else if (!paneClosed && $scope.$pane.closed) {
           $scope.$pane.toggle();
           rootScopeSvc.treePaneClosed($scope.$pane.closed);
       }
    }));

    if (rootScopeSvc.treeShowPe() === null) {
        rootScopeSvc.treeShowPe(false);
    }
    $scope.buttons = [];
    $scope.treeButtons = [];
    $scope.projectOb = projectOb;
    $scope.refOb = refOb;

    //rootScopeSvc.veFullDocMode(false);
    if ($state.includes('project.ref.document.full')) {
        rootScopeSvc.veFullDocMode(true);
    }
    var docEditable = documentOb && refOb && refOb.type === 'Branch' && UtilsService.isView(documentOb) && PermissionsService.hasBranchEditPermission(refOb);

    $scope.tbApi.init = function() {
        if ($state.includes('project.ref.document')) {
            var viewModeButton = UxService.getButtonBarButton("view-mode-dropdown");
            $scope.tbApi.addButton(viewModeButton);
            $scope.tbApi.select(viewModeButton, rootScopeSvc.treeShowPe() ? UxService.getButtonBarButton('tree-show-pe') : UxService.getButtonBarButton('tree-show-views'));
        }
    };
    
    $scope.bbApi.init = function() {
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-expand"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-collapse"));
        if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-reorder-group"));
            $scope.bbApi.setPermission("tree-reorder-group", projectOb && PermissionsService.hasProjectEditPermission(projectOb));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-document-or-group"));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-delete-document"));
            $scope.bbApi.setPermission( "tree-add-document-or-group", (refOb.type === 'Tag' ? false : true) && PermissionsService.hasBranchEditPermission(refOb) );
            $scope.bbApi.setPermission( "tree-delete-document", (refOb.type === 'Tag' ? false : true) && PermissionsService.hasBranchEditPermission(refOb) );
        } else if ($state.includes('project.ref.document')) {
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-reorder-view"));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-full-document"));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-view"));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-delete-view"));
            $scope.bbApi.setPermission("tree-add-view", docEditable);
            $scope.bbApi.setPermission("tree-reorder-view", docEditable);
            $scope.bbApi.setPermission("tree-delete-view", docEditable);
            if (rootScopeSvc.veFullDocMode()) {
                $scope.bbApi.setToggleState('tree-full-document', true);
            }
        }
    };

   $scope.subs.push(eventSvc.$on('tree-expand', function () {
        $scope.treeApi.expand_all();
    }));

   $scope.subs.push(eventSvc.$on('tree-collapse', function () {
        $scope.treeApi.collapse_all();
    }));

   $scope.subs.push(eventSvc.$on('tree-add-document', function () {
        addItem('Document');
    }));

   $scope.subs.push(eventSvc.$on('tree-delete-document', function () {
        $scope.deleteItem();
    }));

   $scope.subs.push(eventSvc.$on('tree-add-view', function () {
        addItem('View');
    }));

   $scope.subs.push(eventSvc.$on('tree-delete', function () {
        $scope.deleteItem();
    }));

   $scope.subs.push(eventSvc.$on('tree-delete-view', function () {
        $scope.deleteItem(function (deleteBranch) {
            eventSvc.$broadcast('mms-full-doc-view-deleted', deleteBranch);
        });
    }));

   $scope.subs.push(eventSvc.$on('tree-reorder-view', function () {
        rootScopeSvc.veFullDocMode(false);
        $scope.bbApi.setToggleState("tree-full-document", false);
        $state.go('project.ref.document.order', {search: undefined});
    }));

   $scope.subs.push(eventSvc.$on('tree-reorder-group', function () {
        $state.go('project.ref.groupReorder');
    }));

   $scope.subs.push(eventSvc.$on('tree-add-group', function () {
        addItem('Group');
    }));

   $scope.subs.push(eventSvc.$on('tree-show-pe', function () {
        toggle('showTree');
        rootScopeSvc.treeShowPe(true);
        setPeVisibility(viewId2node[documentOb.id]);
        $scope.treeApi.refresh();
    }));

   $scope.subs.push(eventSvc.$on('tree-show-views', function () {
        toggle('showTree');
        rootScopeSvc.treeShowPe(false);
        setPeVisibility(viewId2node[documentOb.id]);
        $scope.treeApi.refresh();
    }));

    $scope.tableList = [];
    $scope.figureList = [];
    $scope.equationList = [];
    $scope.treeViewModes = [{
        id: 'table',
        title: 'Tables',
        icon: 'fa-table',
        branchList: $scope.tableList
    }, {
        id: 'figure',
        title: 'Figures',
        icon: 'fa-image',
        branchList: $scope.figureList
    }, {
        id: 'equation',
        title: 'Equations',
        icon: 'fa-superscript',
        branchList: $scope.equationList
    }];

    var toggle = function (id) {
        $scope.activeMenu = id;
    };
    // Set active tree view to tree
    toggle('showTree');

   $scope.subs.push(eventSvc.$on('tree-show-tables', function () {
        toggle('table');
    }));
   $scope.subs.push(eventSvc.$on('tree-show-figures', function () {
        toggle('figure');
    }));
   $scope.subs.push(eventSvc.$on('tree-show-equations', function () {
        toggle('equation');
    }));

    // Get a list of specific PE type from branch
    function getPeTreeList(branch, type, list) {
        if (branch.type === type) {
            list.push(branch);
        }
        for (var i = 0; i < branch.children.length; i++) {
            getPeTreeList(branch.children[i], type, list);
        }
    }

    // Function to refresh table and figure list when new item added, deleted or reordered
    function resetPeTreeList(elemType) {
        if (elemType == 'table' || elemType == 'all') {
            $scope.tableList.length = 0;
            getPeTreeList(viewId2node[documentOb.id], 'table', $scope.tableList);
        }
        if (elemType == 'figure' || elemType == 'image' || elemType == 'all') {
            $scope.figureList.length = 0;
            getPeTreeList(viewId2node[documentOb.id], 'figure', $scope.figureList);
        }
        if (elemType == 'equation' || elemType == 'all') {
            $scope.equationList.length = 0;
            getPeTreeList(viewId2node[documentOb.id], 'equation', $scope.equationList);
        }
    }

   $scope.subs.push(eventSvc.$on('tree-full-document', function () {
        $scope.fullDocMode();
    }));

    var groupLevel2Func = function (groupOb, groupNode) {
        groupNode.loading = true;
        ViewService.getProjectDocuments({
            projectId: projectOb.id,
            refId: refOb.id
        }, 2).then(function (documentObs) {
            var docs = [];
            var docOb, i;
            for (i = 0; i < documentObs.length; i++) {
                docOb = documentObs[i];
                if (docOb._groupId === groupOb.id) {
                    docs.push(docOb);
                }
            }
            for (i = 0; i < docs.length; i++) {
                docOb = docs[i];
                groupNode.children.unshift({
                    label: docOb.name,
                    type: refOb.type === 'Branch' ? 'view' : 'snapshot',
                    data: docOb,
                    group: groupOb,
                    children: []
                });
            }
            groupNode.loading = false;
            if ($scope.treeApi.initialSelect) {
                $scope.treeApi.initialSelect();
            }
        });
    };

    var viewId2node = {};
    var seenViewIds = {};
    var handleSingleView = function (v, aggr) {
        var curNode = viewId2node[v.id];
        if (!curNode) {
            curNode = {
                label: v.name,
                type: 'view',
                data: v,
                children: [],
                loading: true,
                aggr: aggr
            };
            viewId2node[v.id] = curNode;
        }
        return curNode;
    };
    var handleChildren = function (curNode, childNodes) {
        var newChildNodes = [];
        var node;
        for (var i = 0; i < childNodes.length; i++) {
            node = childNodes[i];
            if (seenViewIds[node.data.id]) {
                growl.error("Warning: View " + node.data.name + " have multiple parents! Duplicates not shown.");
                continue;
            }
            seenViewIds[node.data.id] = node;
            newChildNodes.push(node);
        }
        curNode.children.push.apply(curNode.children, newChildNodes);
        curNode.loading = false;
        if ($scope.treeApi.refresh) {
            $scope.treeApi.refresh();
        }
    };
    var processDeletedViewBranch = function (branch) {
        var id = branch.data.id;
        if (seenViewIds[id]) {
            delete seenViewIds[id];
        }
        if (viewId2node[id]) {
            delete viewId2node[id];
        }
        for (var i = 0; i < branch.children.length; i++) {
            processDeletedViewBranch(branch.children[i]);
        }
    };
    if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
        //TODO: Evaluate putting this directly into session service as opposed to handing down
        $scope.treeData.push(...UtilsService.buildTreeHierarchy(groupObs, "id", "group", "_parentId", groupLevel2Func));
        ViewService.getProjectDocuments({
            projectId: projectOb.id,
            refId: refOb.id
        }, 2).then(function (documentObs) {
            for (var i = 0; i < documentObs.length; i++) {
                if (!documentObs[i]._groupId || documentObs[i]._groupId == projectOb.id) {
                    $scope.treeData.push({
                        label: documentObs[i].name,
                        type: 'view',
                        data: documentObs[i],
                        children: []
                    });
                }
            }
            if ($scope.treeApi.initialSelect) {
                $scope.treeApi.initialSelect();
            }
        });
    } else {
        if (!documentOb._childViews) {
            documentOb._childViews = [];
        }
        MmsAppUtils.handleChildViews(documentOb, 'composite', undefined, projectOb.id, refOb.id, handleSingleView, handleChildren)
            .then(function (node) {
                var bulkGet = [];
                for (var i in viewId2node) {
                    var view = viewId2node[i].data;
                    if (view._contents && view._contents.operand) {
                        for (var j = 0; j < view._contents.operand.length; j++) {
                            bulkGet.push(view._contents.operand[j].instanceId);
                        }
                    }
                }
                ElementService.getElements({
                    elementIds: bulkGet,
                    projectId: projectOb.id,
                    refId: refOb.id
                }, 0).finally(function () {
                    for (var i in viewId2node) {
                        addSectionElements(viewId2node[i].data, viewId2node[i], viewId2node[i], true);
                    }
                    $scope.treeApi.refresh();
                });
            }, function (reason) {
                console.log(reason);
            });
        $scope.treeData.push(viewId2node[documentOb.id]);
    }

    function addSectionElements(element, viewNode, parentNode, initial) {
        var contents = null;

        var addContentsSectionTreeNode = function (operand) {
            var bulkGet = [];
            var i = 0;
            for (i = 0; i < operand.length; i++) {
                bulkGet.push(operand[i].instanceId);
            }
            ElementService.getElements({
                elementIds: bulkGet,
                projectId: projectOb.id,
                refId: refOb.id,
            }, 0).then(function (ignore) {
                var instances = [];
                for (var i = 0; i < operand.length; i++) {
                    instances.push(ElementService.getElement({
                        projectId: projectOb.id,
                        refId: refOb.id,
                        elementId: operand[i].instanceId,
                    }, 0));
                }
                $q.all(instances).then(function (results) {
                    var k = results.length - 1;
                    for (; k >= 0; k--) {
                        var instance = results[k];
                        var hide = !rootScopeSvc.treeShowPe();
                        if (ViewService.isSection(instance)) {
                            var sectionTreeNode = {
                                label: instance.name,
                                type: "section",
                                viewId: viewNode.data.id,
                                data: instance,
                                children: []
                            };
                            viewId2node[instance.id] = sectionTreeNode;
                            parentNode.children.unshift(sectionTreeNode);
                            addSectionElements(instance, viewNode, sectionTreeNode, initial);
                        } else if (ViewService.getTreeType(instance)) {
                            var otherTreeNode = {
                                label: instance.name,
                                type: ViewService.getTreeType(instance),
                                viewId: viewNode.data.id,
                                data: instance,
                                hide: hide,
                                children: []
                            };
                            parentNode.children.unshift(otherTreeNode);
                        }
                    }
                    $scope.treeApi.refresh();
                    if (initial) {
                        $scope.treeApi.initialSelect();
                    }
                    resetPeTreeList('all');
                }, function (reason) {
                    //view is bad
                });
            }, function (reason) {
            });
        };

        if (element._contents) {
            contents = element._contents;
        } else if (ViewService.isSection(element) && element.specification) {
            contents = element.specification; // For Sections, the contents expression is the specification
        } else {
            //bad?
        }
        if (contents && contents.operand) {
            addContentsSectionTreeNode(contents.operand);
        }
    }

    var treeClickHandler = function (branch) {
        if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
            if (branch.type === 'group') {
                $state.go('project.ref.preview', {
                    documentId: 'site_' + branch.data.id + '_cover',
                    search: undefined
                });
            } else if (branch.type === 'view' || branch.type === 'snapshot') {
                $state.go('project.ref.preview', {documentId: branch.data.id, search: undefined});
            }
        } else if ($state.includes('project.ref.document')) {
            var viewId = (branch.type !== 'view') ? branch.viewId : branch.data.id;
            // var sectionId = branch.type === 'section' ? branch.data.id : null;
            var hash = branch.data.id;
            if (rootScopeSvc.veFullDocMode()) {
                eventSvc.$broadcast('mms-tree-click', branch);
            } else if (branch.type === 'view' || branch.type === 'section') {
                $state.go('project.ref.document.view', {viewId: branch.data.id, search: undefined});
            } else {
                $state.go('project.ref.document.view', {viewId: viewId, search: undefined});
                $timeout(function () {
                    $location.hash(hash);
                    $anchorScroll();
                }, 1000, false);
            }
        }
    };

    var treeDblclickHandler = function (branch) {
        if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
            if (branch.type === 'group')
                $scope.treeApi.expand_branch(branch);
            else if (branch.type === 'view' || branch.type === 'snapshot') {
                $state.go('project.ref.document', {documentId: branch.data.id, search: undefined});
            }
        } else if ($state.includes('project.ref.document')) {
            $scope.treeApi.expand_branch(branch);
        }
    };



    $scope.treeOptions = {
        types: UxService.getTreeTypes(),
        sectionNumbering: $state.includes('project.ref.document') ? true : false,
        numberingDepth: 0,
        numberingSeparator: '.',
        expandLevel: $state.includes('project.ref.document') ? 3 : ($state.includes('project.ref') ? 0 : 1),
        search: '',
        onSelect: 'tree-click',
        onDblclick: 'tree-double-click',
        sort: !$state.includes('project.ref.document')
    };
    if (documentOb && docMeta) {
        $scope.treeOptions.numberingDepth = docMeta.numberingDepth;
        $scope.treeOptions.numberingSeparator = docMeta.numberingSeparator;
        $scope.treeOptions.startChapter = documentOb._startChapter;
    }

    rootScopeSvc.treeOptions($scope.treeOptions);

   $scope.subs.push(eventSvc.$on($scope.treeOptions.onDblclick, (args) => {
        treeDblclickHandler(args.branch);
    }));

   $scope.subs.push(eventSvc.$on($scope.treeOptions.onSelect, (args) => {
        treeClickHandler(args.branch);
    }));

    $scope.fullDocMode = function () {
        if (rootScopeSvc.veFullDocMode()) {
            rootScopeSvc.veFullDocMode(false);
            $scope.bbApi.setToggleState("tree-full-document", false);
            var curBranch = $scope.treeApi.get_selected_branch();
            if (curBranch) {
                var viewId;
                if (curBranch.type !== 'view') {
                    if (curBranch.type === 'section' && curBranch.data.type === 'InstanceSpecification') {
                        viewId = curBranch.data.id;
                    } else {
                        viewId = curBranch.viewId;
                    }
                } else {
                    viewId = curBranch.data.id;
                }
                $state.go('project.ref.document.view', {viewId: viewId, search: undefined});
            }
        } else {
            rootScopeSvc.veFullDocMode(true);
            $scope.bbApi.setToggleState("tree-full-document", true);
            $state.go('project.ref.document.full', {search: undefined});
        }
    };

    var addItem = function (itemType) {
        $scope.itemType = itemType;
        $scope.newViewAggr = {type: 'shared'};
        var branch = $scope.treeApi.get_selected_branch();
        var templateUrlStr = "";
        var newBranchType = "";

        if (itemType === 'Document') {
            if (!branch) {
                $scope.parentBranchData = {id: "holding_bin_" + projectOb.id};
            } else if (branch.type !== 'group') {
                growl.warning("Select a group to add document under");
                return;
            } else {
                $scope.parentBranchData = branch.data;
            }
            templateUrlStr = 'partials/mms/new-doc-or-group.html';
            newBranchType = 'view';
        } else if (itemType === 'Group') {
            if (branch && branch.type === 'group') {
                $scope.parentBranchData = branch.data;
            } else {
                $scope.parentBranchData = {id: "holding_bin_" + projectOb.id};
                // Always create group at root level if the selected branch is not a group branch
                branch = null;
            }
            templateUrlStr = 'partials/mms/new-doc-or-group.html';
            newBranchType = 'group';
        } else if (itemType === 'View') {
            if (!branch) {
                growl.warning("Add View Error: Select parent view first");
                return;
            } else if (branch.type === "section") {
                growl.warning("Add View Error: Cannot add a child view to a section");
                return;
            } else if (branch.aggr === 'none') {
                growl.warning("Add View Error: Cannot add a child view to a non-owned and non-shared view.");
                return;
            }
            $scope.parentBranchData = branch.data;
            templateUrlStr = 'partials/mms/new-view.html';
            newBranchType = 'view';
        } else {
            growl.error("Add Item of Type " + itemType + " is not supported");
            return;
        }
        // Adds the branch:
        var instance = $uibModal.open({
            templateUrl: templateUrlStr,
            scope: $scope,
            controller: ['$scope', '$uibModalInstance', '$filter', addItemCtrl]
        });
        instance.result.then(function (data) {
            if (!rootScopeSvc.veEditMode()) {
                $timeout(function () {
                    $('.show-edits').click();
                }, 0, false);
            }
            var newbranch = {
                label: data.name,
                type: newBranchType,
                data: data,
                children: []
            };
            var top = itemType === 'Group' ? true : false;
            $scope.treeApi.add_branch(branch, newbranch, top);

            var addToFullDocView = function (node, curSection, prevSysml) {
                var lastChild = prevSysml;
                if (node.children) {
                    var num = 1;
                    for (var i = 0; i < node.children.length; i++) {
                        var cNode = node.children[i];
                        var data = {
                            vId: cNode.data.id,
                            curSec: curSection + '.' + num,
                            prevSibId: lastChild
                        };
                        eventSvc.$broadcast('mms-new-view-added', data);
                        lastChild = addToFullDocView(cNode, curSection + '.' + num, cNode.data.id);
                        num = num + 1;
                    }
                }
                return lastChild;
            };

            if (itemType === 'View') {
                viewId2node[data.id] = newbranch;
                seenViewIds[data.id] = newbranch;
                newbranch.aggr = $scope.newViewAggr.type;
                var curNum = branch.children[branch.children.length - 1].section;
                var prevBranch = $scope.treeApi.get_prev_branch(newbranch);
                while (prevBranch.type !== 'view') {
                    prevBranch = $scope.treeApi.get_prev_branch(prevBranch);
                }
                MmsAppUtils.handleChildViews(data, $scope.newViewAggr.type, undefined, projectOb.id, refOb.id, handleSingleView, handleChildren)
                    .then(function (node) {
                        // handle full doc mode
                        if (rootScopeSvc.veFullDocMode()) {
                            addToFullDocView(node, curNum, newbranch.data.id);
                        }
                        addViewSectionsRecursivelyForNode(node);
                    });
                if (!rootScopeSvc.veFullDocMode()) {
                    $state.go('project.ref.document.view', {viewId: data.id, search: undefined});
                } else {
                    if (prevBranch) {
                        eventSvc.$broadcast('mms-new-view-added', {vId: data.id, curSec: curNum, prevSibId: prevBranch.data.id});
                    } else {
                        eventSvc.$broadcast('mms-new-view-added', {vId: data.id, curSec: curNum, prevSibId: branch.data.id});
                    }
                }
            }
        });
    };

    var addItemCtrl = function ($scope, $uibModalInstance) {
        $scope.createForm = true;
        $scope.oking = false;
        $scope.projectOb = projectOb;
        $scope.refOb = refOb;
        var displayName = "";

        if ($scope.itemType === 'Document') {
            $scope.newDoc = {name: ''};
            displayName = "Document";
        } else if ($scope.itemType === 'View') {
            $scope.newView = {name: ''};
            displayName = "View";
        } else if ($scope.itemType === 'Group') {
            $scope.newGroup = {name: ''};
            displayName = "Group";
        } else {
            growl.error("Add Item of Type " + $scope.itemType + " is not supported");
            return;
        }

        var addExistingView = function (view) {
            var viewId = view.id;
            if (seenViewIds[viewId]) {
                growl.error("Error: View " + view.name + " is already in this document.");
                return;
            }
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            ViewService.addViewToParentView({
                parentViewId: $scope.parentBranchData.id,
                viewId: viewId,
                projectId: $scope.parentBranchData._projectId,
                refId: $scope.parentBranchData._refId,
                aggr: $scope.newViewAggr.type
            }).then(function (data) {
                ElementService.getElement({
                    elementId: viewId,
                    projectId: view._projectId,
                    refId: view._refId
                }, 2, false)
                    .then(function (realView) {
                        $uibModalInstance.close(realView);
                    }, function () {
                        $uibModalInstance.close(view);
                    }).finally(function () {
                    growl.success("View Added");
                });
            }, function (reason) {
                growl.error("View Add Error: " + reason.message);
            }).finally(function () {
                $scope.oking = false;
            });
        };


        var queryFilter = function () {
            var obj = {};
            obj.terms = {'_appliedStereotypeIds': [UtilsService.VIEW_SID, UtilsService.DOCUMENT_SID].concat(UtilsService.OTHER_VIEW_SID)};
            return obj;
        };

        $scope.searchOptions = {
            callback: addExistingView,
            itemsPerPage: 200,
            filterQueryList: [queryFilter],
            hideFilterOptions: true
        };

        $scope.ok = function () {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            var promise;

            // Item specific promise: //TODO branch and tags
            if ($scope.itemType === 'Document') {
                promise = ViewService.createDocument({
                    _projectId: projectOb.id,
                    _refId: refOb.id,
                    id: $scope.parentBranchData.id
                }, {
                    viewName: $scope.newDoc.name,
                    isDoc: true
                });
            } else if ($scope.itemType === 'View') {
                $scope.newViewAggr.type = "composite";
                promise = ViewService.createView($scope.parentBranchData, {
                    viewName: $scope.newView.name
                });
            } else if ($scope.itemType === 'Group') {
                promise = ViewService.createGroup($scope.newGroup.name,
                    {
                        _projectId: projectOb.id,
                        _refId: refOb.id,
                        id: $scope.parentBranchData.id
                    }, orgOb.id
                );
            } else {
                growl.error("Add Item of Type " + $scope.itemType + " is not supported");
                $scope.oking = false;
                return;
            }

            promise.then(function (data) {
                growl.success(displayName + " Created");
                if ($scope.itemType === 'Tag') {
                    growl.info('Please wait for a completion email prior to viewing of the tag.');
                }
                $uibModalInstance.close(data);
            }, function (reason) {
                growl.error("Create " + displayName + " Error: " + reason.message);
            }).finally(function () {
                $scope.oking = false;
            });
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss();
        };
    };

    $scope.deleteItem = function (cb) {
        var branch = $scope.treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Select item to remove.");
            return;
        }
        var type = ViewService.getElementType(branch.data);
        if ($state.includes('project.ref.document')) {
            if (type == 'Document') {
                growl.warning("Cannot remove a document from this view. To remove this item, go to project home.");
                return;
            }
            if (branch.type !== 'view' || (!UtilsService.isView(branch.data))) {
                growl.warning("Cannot remove non-view item. To remove this item, open it in the center pane.");
                return;
            }
        }

        // when in project.ref state, allow deletion for view/document/group
        if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
            if (branch.type !== 'view' && !UtilsService.isDocument(branch.data) && (branch.type !== 'group' || branch.children.length > 0)) {
                growl.warning("Cannot remove group with contents. Empty contents and try again.");
                return;
            }
        }
        $scope.deleteBranch = branch;
        var instance = $uibModal.open({
            templateUrl: 'partials/mms/confirmRemove.html',
            scope: $scope,
            controller: ['$scope', '$uibModalInstance', deleteCtrl]
        });
        instance.result.then(function (data) {
            $scope.treeApi.remove_branch(branch);
            if ($state.includes('project.ref.document') && branch.type === 'view') {
                processDeletedViewBranch(branch);
            }
            if (rootScopeSvc.veFullDocMode()) {
                cb(branch);
            } else {
                $scope.treeApi.clear_selected_branch();
                $state.go('^', {search: undefined});
            }
        });
    };

    // TODO: Make this a generic delete controller
    var deleteCtrl = function ($scope, $uibModalInstance) {
        var branch = $scope.deleteBranch;
        $scope.oking = false;
        $scope.type = branch.type;
        if (UtilsService.isDocument(branch.data)) {
            $scope.type = 'Document';
        }
        $scope.name = branch.data.name;
        $scope.ok = function () {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            var promise = null;
            if (branch.type === 'view') {
                var parentBranch = $scope.treeApi.get_parent_branch(branch);
                if (!$state.includes('project.ref.document')) {
                    promise = ViewService.downgradeDocument(branch.data);
                } else {
                    promise = ViewService.removeViewFromParentView({
                        projectId: parentBranch.data._projectId,
                        refId: parentBranch.data._refId,
                        parentViewId: parentBranch.data.id,
                        viewId: branch.data.id
                    });
                }
            } else if (branch.type === 'group') {
                promise = ViewService.removeGroup(branch.data);
            }

            if (promise) {
                promise.then(function (data) {
                    growl.success($scope.type + " Removed");
                    $uibModalInstance.close('ok');
                }, function (reason) {
                    growl.error($scope.type + ' Removal Error: ' + reason.message);
                }).finally(function () {
                    $scope.oking = false;
                });
            } else {
                $scope.oking = false;
                $uibModalInstance.dismiss();
            }
        };
        $scope.cancel = function () {
            $uibModalInstance.dismiss();
        };
    };

    function addViewSections(view) {
        var node = viewId2node[view.id];
        addSectionElements(view, node, node);
    }

    function addViewSectionsRecursivelyForNode(node) {
        addViewSections(node.data);
        for (var i = 0; i < node.children.length; i++) {
            if (node.children[i].type === 'view') {
                addViewSectionsRecursivelyForNode(node.children[i]);
            }
        }
    }

    function setPeVisibility(branch) {
        if (branch.type === 'figure' || branch.type === 'table' || branch.type === 'equation') {
            branch.hide = !rootScopeSvc.treeShowPe();
        }
        for (var i = 0; i < branch.children.length; i++) {
            setPeVisibility(branch.children[i]);
        }
    }

    // Utils creates this event when deleting instances from the view
   $scope.subs.push(eventSvc.$on('viewctrl.delete.element', function (elementData) {
        var branch = $scope.treeApi.get_branch(elementData);
        if (branch) {
            $scope.treeApi.remove_single_branch(branch);
        }
        resetPeTreeList(branch.type);
    }));

   $scope.subs.push(eventSvc.$on('view.reorder.saved', function (data) {
        var node = viewId2node[data.id];
        var viewNode = node;
        var newChildren = [];
        for (var i = 0; i < node.children.length; i++) {
            var child = node.children[i];
            if (child.type === 'view') {
                newChildren.push(child);
            }
        }
        node.children = newChildren;
        if (node.type === 'section') {
            viewNode = viewId2node[node.view];
            if (!viewNode) {
                viewNode = node;
            }
        }
        addSectionElements(node.data, viewNode, node);
    }));

    //TODO refresh table and fig list when new item added, deleted or reordered
    $scope.user_clicks_branch = function (branch) {
        $scope.treeApi.user_clicks_branch(branch);
    };

    $scope.searchInputChangeHandler = function () {
        if ($scope.treeOptions.search === '') {
            $scope.treeApi.collapse_all();
            $scope.treeApi.expandPathToSelectedBranch();
        } else {
            // expand all branches so that the filter works correctly
            $scope.treeApi.expand_all();
        }
    };

}]);
