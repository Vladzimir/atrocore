/*
 * This file is part of EspoCRM and/or AtroCore.
 *
 * EspoCRM - Open Source CRM application.
 * Copyright (C) 2014-2019 Yuri Kuznetsov, Taras Machyshyn, Oleksiy Avramenko
 * Website: http://www.espocrm.com
 *
 * AtroCore is EspoCRM-based Open Source application.
 * Copyright (C) 2020 AtroCore UG (haftungsbeschränkt).
 *
 * AtroCore as well as EspoCRM is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AtroCore as well as EspoCRM is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EspoCRM. If not, see http://www.gnu.org/licenses/.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word
 * and "AtroCore" word.
 */

Espo.define('views/record/detail', ['views/record/base', 'view-record-helper'], function (Dep, ViewRecordHelper) {

    return Dep.extend({

        template: 'record/detail',

        type: 'detail',

        name: 'detail',

        layoutName: 'detail',

        fieldsMode: 'detail',

        gridLayout: null,

        detailLayout: null,

        buttonsDisabled: false,

        columnCount: 2,

        scope: null,

        isNew: false,

        additionalButtons: [],

        buttonList: [
            {
                name: 'edit',
                label: 'Edit',
                style: 'primary',
            }
        ],

        dropdownItemList: [
            {
                name: 'delete',
                label: 'Remove'
            }
        ],

        buttonEditList: [
            {
                name: 'save',
                label: 'Save',
                style: 'primary',
                edit: true
            },
            {
                name: 'saveAndNext',
                label: 'Save and edit next',
                edit: true
            },
            {
                name: 'saveAndCreate',
                label: 'Save and Create',
                edit: true
            },
            {
                name: 'cancelEdit',
                label: 'Cancel',
                edit: true
            }
        ],

        dropdownEditItemList: [],

        id: null,

        returnUrl: null,

        returnDispatchParams: null,

        middleView: 'views/record/detail-middle',

        sideView: 'views/record/detail-side',

        bottomView: 'views/record/detail-bottom',

        sideDisabled: false,

        bottomDisabled: false,

        editModeDisabled: false,

        readOnly: false,

        isWide: false,

        dependencyDefs: {},

        duplicateAction: true,

        selfAssignAction: false,

        inlineEditDisabled: false,

        portalLayoutDisabled: false,

        fetchOnModelAfterSaveError: true,

        panelNavigationView: 'views/record/panel-navigation',

        events: {
            'click .button-container .action': function (e) {
                var $target = $(e.currentTarget);
                var action = $target.data('action');
                var data = $target.data();
                if (action) {
                    var method = 'action' + Espo.Utils.upperCaseFirst(action);
                    if (typeof this[method] == 'function') {
                        this[method].call(this, data, e);
                        e.preventDefault();
                    }
                }
            },
            'click a[data-action="setAsInherited"]': function (e) {
                const $el = $(e.currentTarget);
                this.ajaxPostRequest(`${this.scope}/action/inheritField`, {
                    field: $el.parent().data('name'),
                    id: this.model.get('id')
                }).then(response => {
                    this.model.fetch().then(() => {
                        this.afterSave();
                        this.trigger('after:save');
                        this.model.trigger('after:save');
                        this.notify('Saved', 'success');
                    });
                });
            },
            'click a[data-action="collapseAllPanels"]': function (e) {
                this.collapseAllPanels('hide');
            },
            'click a[data-action="expandAllPanels"]': function (e) {
                this.collapseAllPanels('show');
            },
        },

        collapseAllPanels(type) {
            let bottom = this.getView('bottom');
            if (bottom) {
                (bottom.panelList || []).forEach(panel => {
                    bottom.trigger('collapsePanel', panel.name, type);
                });
            }
        },

        actionEdit: function () {
            if (!this.editModeDisabled) {
                this.setEditMode();
                this.resetSidebar();
            } else {
                var options = {
                    id: this.model.id,
                    model: this.model
                };
                if (this.options.rootUrl) {
                    options.rootUrl = this.options.rootUrl;
                }
                this.getRouter().navigate('#' + this.scope + '/edit/' + this.model.id, {trigger: false});
                this.getRouter().dispatch(this.scope, 'edit', options);
            }
        },

        actionInheritAllForChildren: function () {
            this.confirm({message: this.translate('confirmInheritAllForChildren', 'messages'), confirmText: this.translate('Apply')}, () => {
                this.notify(this.translate('pleaseWait', 'messages'));
                this.ajaxPostRequest(this.scope + '/action/InheritAllForChildren', {id: this.model.id}).then(() => {
                    this.notify('Done', 'success');
                });
            });
        },

        actionDelete: function () {
            this.delete();
        },

        actionSave: function () {
            if (this.save(null, true)) {
                this.setDetailMode();
            }
        },

        actionSaveAndNext: function () {
            this.save(function () {
                this.getParentView().actionNext();
            }.bind(this), true);
        },

        actionSaveAndCreate: function () {
            this.save(function () {
                this.getRouter().navigate('#' + this.scope + '/create', {trigger: false});
                this.getRouter().dispatch(this.scope, 'create');
            }.bind(this), true);
        },

        actionCancelEdit: function () {
            this.cancelEdit();
            this.resetSidebar();
        },

        actionSelfAssign: function () {
            var attributes = {
                assignedUserId: this.getUser().id,
                assignedUserName: this.getUser().get('name')
            };
            if ('getSelfAssignAttributes' in this) {
                var attributesAdditional = this.getSelfAssignAttributes();
                if (attributesAdditional) {
                    for (var i in attributesAdditional) {
                        attributes[i] = attributesAdditional[i];
                    }
                }
            }
            this.model.save(attributes, {
                patch: true
            }).then(function () {
                Espo.Ui.success(this.translate('Self-Assigned'));
            }.bind(this));
        },

        getSelfAssignAttributes: function () {
        },

        setupActionItems: function () {
            if (this.model.isNew()) {
                this.isNew = true;
                this.removeButton('delete');
            }

            if (this.duplicateAction) {
                if (this.getAcl().check(this.entityType, 'create')) {
                    this.dropdownItemList.push({
                        'label': 'Duplicate',
                        'name': 'duplicate'
                    });
                }
            }

            if (this.getMetadata().get(`scopes.${this.entityType}.type`) === 'Hierarchy' && !this.model.isNew()) {
                if (this.getAcl().check(this.entityType, 'edit')) {
                    this.dropdownItemList.push({
                        'label': 'inheritAllForChildren',
                        'name': 'inheritAllForChildren'
                    });
                }
            }

            if (this.selfAssignAction) {
                if (
                    this.getAcl().check(this.entityType, 'edit')
                    &&
                    !~this.getAcl().getScopeForbiddenFieldList(this.entityType).indexOf('assignedUser')
                ) {
                    if (this.model.has('assignedUserId')) {
                        this.dropdownItemList.push({
                            'label': 'Self-Assign',
                            'name': 'selfAssign',
                            'hidden': !!this.model.get('assignedUserId')
                        });
                        this.listenTo(this.model, 'change:assignedUserId', function () {
                            if (!this.model.get('assignedUserId')) {
                                this.showActionItem('selfAssign');
                            } else {
                                this.hideActionItem('selfAssign');
                            }
                        }, this);
                    }
                }
            }

            if (this.type === 'detail' && this.getMetadata().get(['scopes', this.scope, 'hasPersonalData'])) {
                if (this.getAcl().get('dataPrivacyPermission') !== 'no') {
                    this.dropdownItemList.push({
                        'label': 'View Personal Data',
                        'name': 'viewPersonalData'
                    });
                }
            }

            const dropDownItems = this.getMetadata().get(['clientDefs', this.scope, 'additionalDropdownItems']) || {};
            Object.keys(dropDownItems).forEach(item => {
                const check = (dropDownItems[item].conditions || []).every(condition => {
                    let check;
                    switch (condition.type) {
                        case 'type':
                            check = this.type === condition.value;
                            break;
                        default:
                            check = true;
                            break;
                    }
                    return check;
                });

                if (check) {
                    let dropdownItem = {
                        name: dropDownItems[item].name,
                        label: dropDownItems[item].label
                    };
                    if (dropDownItems[item].iconClass) {
                        let htmlLogo = `<span class="additional-action-icon ${dropDownItems[item].iconClass}"></span>`;
                        dropdownItem.html = `${this.translate(dropDownItems[item].label, 'labels', this.scope)} ${htmlLogo}`;
                    }
                    this.dropdownItemList.push(dropdownItem);

                    let method = 'action' + Espo.Utils.upperCaseFirst(dropDownItems[item].name);
                    this[method] = function () {
                        let path = dropDownItems[item].actionViewPath;

                        let o = {dropdownItem: dropDownItems[item]};
                        (dropDownItems[item].optionsToPass || []).forEach((option) => {
                            if (option in this) {
                                o[option] = this[option];
                            }
                        });

                        this.createView(item, path, o, (view) => {
                            if (typeof view[dropDownItems[item].action] === 'function') {
                                view[dropDownItems[item].action]();
                            }
                        });
                    };
                }
            }, this);
        },

        disableActionItems: function () {
            this.disableButtons();
        },

        enableActionItems: function () {
            this.enableButtons();
        },

        hideActionItem: function (name) {
            for (var i in this.buttonList) {
                if (this.buttonList[i].name == name) {
                    this.buttonList[i].hidden = true;
                    break;
                }
            }
            for (var i in this.dropdownItemList) {
                if (this.dropdownItemList[i].name == name) {
                    this.dropdownItemList[i].hidden = true;
                    break;
                }
            }

            if (this.isRendered()) {
                this.$detailButtonContainer.find('li > .action[data-action="' + name + '"]').parent().addClass('hidden');
                this.$detailButtonContainer.find('button.action[data-action="' + name + '"]').addClass('hidden');
                if (this.isDropdownItemListEmpty()) {
                    this.$dropdownItemListButton.addClass('hidden');
                }
            }
        },

        showActionItem: function (name) {
            for (var i in this.buttonList) {
                if (this.buttonList[i].name == name) {
                    this.buttonList[i].hidden = false;
                    break;
                }
            }
            for (var i in this.dropdownItemList) {
                if (this.dropdownItemList[i].name == name) {
                    this.dropdownItemList[i].hidden = false;
                    break;
                }
            }

            if (this.isRendered()) {
                this.$detailButtonContainer.find('li > .action[data-action="' + name + '"]').parent().removeClass('hidden');
                this.$detailButtonContainer.find('button.action[data-action="' + name + '"]').removeClass('hidden');
                if (!this.isDropdownItemListEmpty()) {
                    this.$dropdownItemListButton.removeClass('hidden');
                }
            }
        },

        showPanel: function (name) {
            this.recordHelper.setPanelStateParam(name, 'hidden', false);

            var middleView = this.getView('middle');
            if (middleView) {
                middleView.showPanel(name);
            }

            var bottomView = this.getView('bottom');
            if (bottomView) {
                if ('showPanel' in bottomView) {
                    bottomView.showPanel(name);
                }
            }

            var sideView = this.getView('side');
            if (sideView) {
                if ('showPanel' in sideView) {
                    sideView.showPanel(name);
                }
            }
        },

        hidePanel: function (name) {
            this.recordHelper.setPanelStateParam(name, 'hidden', true);

            var middleView = this.getView('middle');
            if (middleView) {
                middleView.hidePanel(name);
            }

            var bottomView = this.getView('bottom');
            if (bottomView) {
                if ('hidePanel' in bottomView) {
                    bottomView.hidePanel(name);
                }
            }

            var sideView = this.getView('side');
            if (sideView) {
                if ('hidePanel' in sideView) {
                    sideView.hidePanel(name);
                }
            }
        },

        afterRender: function () {
            var $container = this.$el.find('.detail-button-container');

            var stickTop = this.getThemeManager().getParam('stickTop') || 62;
            var blockHeight = this.getThemeManager().getParam('blockHeight') || ($container.innerHeight() / 2);

            var $block = $('<div>').css('height', blockHeight + 'px').html('&nbsp;').hide().insertAfter($container);
            var $middle = this.getView('middle').$el;
            var $window = $(window);

            var screenWidthXs = this.getThemeManager().getParam('screenWidthXs');

            let $side = this.getView('side');

            $window.off('scroll.side');
            if ($side) {
                let prevScroll = 0;

                if (['detail', 'edit'].includes($side.type)) {
                    let observer = new ResizeObserver(() => {
                        let width = $side.$el.innerWidth();

                        width = parseInt(width);

                        const content = $('#content');
                        if (content.length) {
                            const contentWidth = Math.floor(content.get(0).getBoundingClientRect().width);
                            const overview = content.find('.overview');

                            overview.outerWidth(contentWidth - $('.catalog-tree-panel').outerWidth() - width);
                            $side.$el.css({'min-height': ($window.innerHeight() - $side.$el.offset().top) + 'px'});
                        }
                    });
                    observer.observe($('#content').get(0));

                    $side.$el.css({'min-height': ($window.innerHeight() - $side.$el.offset().top) + 'px'});
                }

                $window.resize(function () {
                    let side = $('#main > .record .row > .side');

                    if (side.length) {
                        let width = side.outerWidth();

                        if (side.outerHeight() < $window.height() - (parseInt($('body').css('padding-top')) + $('.record-buttons').outerHeight())) {
                            side.attr('style', '');
                            side.removeClass('fixed-top fixed-bottom scrolled');
                        }

                        if ($window.width() >= 768) {
                            side.css({
                                'width': width + 'px',
                                'min-height': ($window.innerHeight() - side.offset().top) + 'px'
                            });

                            if (side.hasClass('collapsed')) {
                                const recordButtons = $('.record-buttons.stick-sub');

                                if (recordButtons.length && ($window.scrollTop() > recordButtons.outerHeight(true))) {
                                    side.addClass('fixed-top');
                                }
                            }
                        } else {
                            side.css({'min-height': 'unset'});
                        }
                    }
                });

                $window.on('scroll.side', function (e) {
                    let side = $('#main > .record .row > .side');

                    let pageHeader = $('.nav.navbar-nav.navbar-right');
                    let buttonContainer = $('.record-buttons');
                    let topHeight = pageHeader.outerHeight() + buttonContainer.outerHeight();
                    if (buttonContainer.hasClass('stick-sub')) {
                        topHeight = $('.nav.navbar-right').outerHeight() + buttonContainer.outerHeight();
                    }

                    let overview = $('.overview');

                    let scroll = $window.scrollTop();

                    if (side.length) {
                        // if screen width more than 768 pixels and side panel height more than screen height
                        if ($window.width() >= 768 && overview.outerHeight() > side.outerHeight()) {
                            let sideWidth = side.outerWidth();

                            if (side.outerHeight() > $window.height() - topHeight) {

                                // define scrolling direction
                                if (scroll > prevScroll) {

                                    // if side panel scrolled to end
                                    if (scroll > side.outerHeight() - ($window.height() - side.offset().top)) {
                                        side.attr('style', '');

                                        if (side.hasClass('fixed-top')) {
                                            side.addClass('scrolled');
                                            side.css({
                                                'top': side.offset().top + 'px'
                                            });
                                        } else {
                                            side.removeClass('scrolled');
                                            side.addClass('fixed-bottom');
                                        }
                                    } else {
                                        if (!side.hasClass('fixed-bottom') && side.hasClass('fixed-top')) {
                                            side.css({
                                                'top': side.offset().top + 'px'
                                            });
                                            side.addClass('scrolled');
                                            side.removeClass('fixed-top');
                                        }
                                    }

                                    if (scroll > $('body').prop('scrollHeight') - $window.outerHeight() - 28) {
                                        if (side.hasClass('scrolled')) {
                                            let top = parseFloat(side.css('top'));
                                            side.css({'top': (top - 28) + 'px'});
                                        } else {
                                            side.css({'bottom': '28px'});
                                        }
                                    }
                                } else {

                                    // if side panel has just start scrolling up
                                    if (side.hasClass('fixed-bottom') && scroll !== 0) {
                                        side.removeClass('fixed-bottom');

                                        side.addClass('scrolled');
                                        side.css({
                                            'top': (scroll - (side.outerHeight() - $window.height())) + 'px'
                                        });
                                    } else {
                                        // if panel scrolled to end
                                        if (scroll < topHeight) {
                                            side.attr('style', '');
                                            side.removeClass('fixed-top fixed-bottom scrolled');
                                        } else {
                                            if (scroll < side.offset().top - topHeight) {
                                                side.attr('style', '');
                                                side.removeClass('scrolled');
                                                side.addClass('fixed-top');
                                                side.css('top', (topHeight - 5) + 'px');
                                            }
                                        }
                                    }

                                    if (scroll < $('body').prop('scrollHeight') - $window.outerHeight()) {
                                        side.css({'bottom': 'unset'});
                                    }
                                }
                            } else {
                                if (scroll > prevScroll) {
                                    if (scroll > side.offset().top - topHeight) {
                                        side.addClass('fixed-top');
                                        side.css('top', (topHeight - 5) + 'px');
                                    }
                                } else {
                                    if (scroll < parseInt($('body').css('padding-top')) + $('.record-buttons').outerHeight()) {
                                        side.attr('style', '');
                                        side.removeClass('fixed-top');
                                    }
                                }
                            }

                            side.css({
                                'width': sideWidth + 'px'
                            });
                        }

                        prevScroll = scroll;
                        side.css({'min-height': ($(window).innerHeight() - side.offset().top) + 'px'});
                    }
                }.bind(this));
            }

            $window.off('scroll.detail-' + this.numId);
            $window.on('scroll.detail-' + this.numId, function (e) {
                if ($(window.document).width() < screenWidthXs) {
                    $container.removeClass('stick-sub');
                    $block.hide();
                    $container.show();
                    return;
                }

                var edge = $middle.position().top + $middle.outerHeight(true);
                var scrollTop = $window.scrollTop();

                if (scrollTop < edge) {
                    if (scrollTop > stickTop) {
                        if (!$container.hasClass('stick-sub')) {
                            $container.addClass('stick-sub');
                            $block.show();

                            var $p = $('.popover');
                            $p.each(function (i, el) {
                                $el = $(el);
                                $el.css('top', ($el.position().top - blockHeight) + 'px');
                            });
                        }
                    } else {
                        if ($container.hasClass('stick-sub')) {
                            $container.removeClass('stick-sub');
                            $block.hide();

                            var $p = $('.popover');
                            $p.each(function (i, el) {
                                $el = $(el);
                                $el.css('top', ($el.position().top + blockHeight) + 'px');
                            });
                        }
                    }
                    $container.show();
                } else {
                    $container.hide();
                    $block.show();
                }
            }.bind(this));

            var fields = this.getFieldViews();

            var fieldInEditMode = null;
            for (var field in fields) {
                var fieldView = fields[field];
                this.listenTo(fieldView, 'edit', function (view) {
                    if (fieldInEditMode && fieldInEditMode.mode == 'edit') {
                        fieldInEditMode.inlineEditClose();
                    }
                    fieldInEditMode = view;
                }, this);

                this.listenTo(fieldView, 'inline-edit-on', function () {
                    this.inlineEditModeIsOn = true;
                }, this);
                this.listenTo(fieldView, 'inline-edit-off', function () {
                    this.inlineEditModeIsOn = false;
                    this.setIsNotChanged();
                }, this);
            }

            let searchContainer = $('.page-header .search-container');
            if (searchContainer.length && !this.$el.parents('.modal-container').length) {
                searchContainer.addClass('hidden');
            }

            let headerButtonsContainer = $('.header-buttons-container');
            if (headerButtonsContainer.length) {
                let main = $('#main');
                let headerBreadcrumbs = $('.header-breadcrumbs:not(.fixed-header-breadcrumbs)');

                if (main.length && headerBreadcrumbs.length && headerButtonsContainer.outerWidth() > main.outerWidth() - headerBreadcrumbs.outerWidth()) {
                    // headerButtonsContainer.addClass('full-row');
                }
            }

            let overview = $('.record .overview');
            let side = $('#main > .record .row > .side');
            if (overview.length && side.length) {
                setTimeout(function () {
                    if (overview.outerHeight() > side.outerHeight()) {
                        overview.addClass('bordered');
                    } else {
                        side.addClass('bordered');
                    }
                }, 100);

                $window.resize(function () {
                    let row = $('.record > .detail > .row');

                    if ($window.outerWidth() > 768) {
                        if (row.length && (side.hasClass('fixed-top') || side.hasClass('fixed-bottom') || side.hasClass('scrolled'))) {

                            side.css({
                                'width': (row.outerWidth() - overview.outerWidth(true)) + 'px'
                            });
                        }
                    }
                });

                let content = $('#content');

                if (content.length) {
                    let pageHeader = $('.page-header');
                    let detailButtons = $('.detail-button-container.record-buttons');
                    let mainOverview = $('#main > .record > .detail > .row > .overview');
                    let mainSide = $('#main > .record > .detail > .row > .side');

                    let minHeight = (content.height() - pageHeader.outerHeight(true) - detailButtons.outerHeight(true));

                    if (mainOverview.outerHeight() > mainSide.outerHeight()) {
                        mainOverview.css({
                            'minHeight': minHeight + 'px'
                        })
                    } else {
                        mainSide.css({
                            'minHeight': minHeight + 'px'
                        })
                    }
                }
            }

            $window.off('scroll.detail-' + this.numId);
            $window.on('scroll.detail-' + this.numId, function (e) {
                if ($(window.document).width() < screenWidthXs) {
                    $container.removeClass('stick-sub');
                    $block.hide();
                    $container.show();
                    return;
                }

                const position = this.$el.position();

                if (position && 'top' in position) {
                    var edge = position.top + this.$el.outerHeight(true);
                    var scrollTop = $window.scrollTop();

                    if (scrollTop < edge) {
                        if (scrollTop > stickTop) {
                            if (!$container.hasClass('stick-sub') && this.mode !== 'edit') {
                                var $p = $('.popover:not(.note-popover)');
                                $p.each(function (i, el) {
                                    var $el = $(el);
                                    $el.css('top', ($el.position().top - ($container.height() - blockHeight * 2 + 10)) + 'px');
                                }.bind(this));
                            }
                            $container.addClass('stick-sub');
                            $block.show();
                        } else {
                            if ($container.hasClass('stick-sub') && this.mode !== 'edit') {
                                var $p = $('.popover:not(.note-popover)');
                                $p.each(function (i, el) {
                                    var $el = $(el);
                                    $el.css('top', ($el.position().top + ($container.height() - blockHeight * 2 + 10)) + 'px');
                                }.bind(this));
                            }
                            $container.removeClass('stick-sub');
                            $block.hide();
                        }
                        var $p = $('.popover');
                        $p.each(function (i, el) {
                            var $el = $(el);
                            let top = $el.css('top').slice(0, -2);
                            if (top > 0 && scrollTop > 0 && top > scrollTop) {
                                if (stickTop > $container.height()) {
                                    if (top - scrollTop > stickTop) {
                                        $el.removeClass('hidden');
                                    } else {
                                        $el.addClass('hidden');
                                    }
                                } else {
                                    if (top - scrollTop > ($container.height() + blockHeight * 2 + 10)) {
                                        $el.removeClass('hidden');
                                    } else {
                                        $el.addClass('hidden');
                                    }
                                }
                            }
                        }.bind(this));
                    }
                }
            }.bind(this));
        },

        resetSidebar() {
            let side = $('#main > .record .row > .side');

            if (side) {
                side.removeClass('scrolled fixed-bottom fixed-top');
            }
        },

        fetch: function () {
            var data = Dep.prototype.fetch.call(this);
            if (this.hasView('side')) {
                var view = this.getView('side');
                if ('fetch' in view) {
                    data = _.extend(data, view.fetch());
                }
            }
            if (this.hasView('bottom')) {
                var view = this.getView('bottom');
                if ('fetch' in view) {
                    data = _.extend(data, view.fetch());
                }
            }
            return data;
        },

        setEditMode: function () {
            this.trigger('before:set-edit-mode');
            this.$el.find('.record-buttons').addClass('hidden');
            this.$el.find('.edit-buttons').removeClass('hidden');
            this.disableButtons();

            var fields = this.getFieldViews(true);
            var count = Object.keys(fields || {}).length;
            for (var field in fields) {
                var fieldView = fields[field];
                if (!fieldView.readOnly) {
                    if (fieldView.mode == 'edit') {
                        fieldView.fetchToModel();
                        fieldView.removeInlineEditLinks();
                        fieldView.inlineEditModeIsOn = false;
                    }
                    fieldView.setMode('edit');
                    fieldView.render(() => {
                        count--;
                        if (count === 0) {
                            this.enableButtons();
                        }
                    });
                } else {
                    count--;
                    if (count === 0) {
                        this.enableButtons();
                    }
                }
            }
            this.mode = 'edit';
            this.trigger('after:set-edit-mode');
            this.model.trigger('after:change-mode', 'edit');
        },

        setDetailMode: function () {
            this.trigger('before:set-detail-mode');
            this.$el.find('.edit-buttons').addClass('hidden');
            this.$el.find('.record-buttons').removeClass('hidden');

            var fields = this.getFieldViews(true);
            for (var field in fields) {
                var fieldView = fields[field];
                if (fieldView.mode != 'detail') {
                    if (fieldView.mode === 'edit') {
                        fieldView.trigger('inline-edit-off');
                    }
                    fieldView.setMode('detail');
                    fieldView.render();
                }
            }
            this.mode = 'detail';
            this.trigger('after:set-detail-mode');
            this.model.trigger('after:change-mode', 'detail');
        },

        cancelEdit: function () {
            this.resetModelChanges();

            this.setDetailMode();
            this.setIsNotChanged();
        },

        resetModelChanges: function () {
            var attributes = this.model.attributes;
            for (var attr in attributes) {
                if (!(attr in this.attributes)) {
                    this.model.unset(attr);
                }
            }

            this.model.set(this.attributes);
        },

        delete: function () {
            let message = 'Global.messages.removeRecordConfirmation';
            if (this.getMetadata().get(`scopes.${this.scope}.type`) === 'Hierarchy') {
                message = 'Global.messages.removeRecordConfirmationHierarchically';
            }

            let scopeMessage = this.getMetadata().get(`clientDefs.${this.scope}.deleteConfirmation`);
            if (scopeMessage) {
                message = scopeMessage;
            }

            let parts = message.split('.');

            this.confirm({
                message: (this.translate(parts.pop(), parts.pop(), parts.pop())).replace('{{name}}', this.model.get('name')),
                confirmText: this.translate('Remove')
            }, function () {
                this.trigger('before:delete');
                this.trigger('delete');

                this.notify('removing');

                var collection = this.model.collection;

                var self = this;
                this.model.destroy({
                    wait: true,
                    error: function () {
                        this.notify('Error occured!', 'error');
                    }.bind(this),
                    success: function () {
                        if (collection) {
                            if (collection.total > 0) {
                                collection.total--;
                            }
                        }

                        this.notify('Removed', 'success');
                        this.trigger('after:delete');
                        this.exit('delete');
                    }.bind(this),
                });
            }, this);
        },

        getFieldViews: function (withHidden) {
            var fields = {};

            if (this.hasView('middle')) {
                if ('getFieldViews' in this.getView('middle')) {
                    _.extend(fields, Espo.Utils.clone(this.getView('middle').getFieldViews(withHidden)));
                }
            }
            if (this.hasView('side')) {
                if ('getFieldViews' in this.getView('side')) {
                    _.extend(fields, this.getView('side').getFieldViews(withHidden));
                }
            }
            if (this.hasView('bottom')) {
                if ('getFieldViews' in this.getView('bottom')) {
                    _.extend(fields, this.getView('bottom').getFieldViews(withHidden));
                }
            }
            return fields;
        },

        getFieldView: function (name) {
            var view;
            if (this.hasView('middle')) {
                view = (this.getView('middle').getFieldViews(true) || {})[name];
            }
            if (!view && this.hasView('side')) {
                view = (this.getView('side').getFieldViews(true) || {})[name];
            }
            if (!view && this.hasView('bottom')) {
                view = (this.getView('bottom').getFieldViews(true) || {})[name];
            }
            return view || null;
        },

        // TODO remove
        handleDataBeforeRender: function (data) {
        },

        data: function () {
            if (!this.options.hasNext) {
                this.buttonEditList = (this.buttonEditList || []).filter(row => {
                    return row.name !== 'saveAndNext';
                });
                this.buttonList = (this.buttonList || []).filter(row => {
                    return row.name !== 'saveAndNext';
                });
            }

            let data = {
                additionalButtons: this.additionalButtons,
                scope: this.scope,
                entityType: this.entityType,
                buttonList: this.buttonList,
                buttonEditList: this.buttonEditList,
                dropdownItemList: this.dropdownItemList,
                dropdownEditItemList: this.dropdownEditItemList,
                dropdownItemListEmpty: this.isDropdownItemListEmpty(),
                buttonsDisabled: this.buttonsDisabled,
                name: this.name,
                id: this.id,
                isWide: this.isWide,
                isSmall: this.type == 'editSmall' || this.type == 'detailSmall'
            };

            if (this.model && !this.model.isNew() && this.getMetadata().get(`scopes.${this.model.urlRoot}.object`) && this.getMetadata().get(`scopes.${this.model.urlRoot}.overviewFilters`) !== false) {
                data.overviewFilters = this.getOverviewFiltersList().map(filter => filter.name);
            }

            return data;
        },

        getOverviewFiltersList: function () {
            let result = [
                {
                    name: "fieldFilter",
                    options: ["allValues", "filled", "empty", "optional", "required"],
                    selfExcludedFieldsMap: {
                        filled: 'empty',
                        empty: 'filled',
                        optional: 'required',
                        required: 'optional'
                    }
                }
            ];

            if (this.getConfig().get('isMultilangActive') && (this.getConfig().get('inputLanguageList') || []).length) {
                result.push({
                    name: "languageFilter",
                    options: ['allLanguages', 'main'].concat(this.getConfig().get('inputLanguageList'))
                });
            }

            return result;
        },

        createOverviewFilters() {
            this.getModelFactory().create(null, model => {
                this.getOverviewFiltersList().forEach(filter => {
                    this.createOverviewFilter(filter, model);
                });
            });
        },

        createOverviewFilter(filter, model) {
            let options = filter.options;
            let translatedOptions = {};
            if (filter.translatedOptions) {
                translatedOptions = filter.translatedOptions;
            } else {
                options.forEach(option => {
                    translatedOptions[option] = this.getLanguage().translateOption(option, filter.name, 'Global');
                });
            }

            let selected = [options[0]];
            if (this.getStorage().get(filter.name, 'OverviewFilter')) {
                selected = [];
                (this.getStorage().get(filter.name, 'OverviewFilter') || []).forEach(option => {
                    if (options.includes(option)) {
                        selected.push(option);
                    }
                });
            }

            this.getStorage().set(filter.name, 'OverviewFilter', selected);
            model.set(filter.name, selected);

            this.createView(filter.name, 'views/fields/multi-enum', {
                el: `${this.options.el} .field[data-name="${filter.name}"]`,
                name: filter.name,
                mode: 'edit',
                model: model,
                dragDrop: false,
                params: {
                    options: options,
                    translatedOptions: translatedOptions
                }
            }, view => {
                let all = options[0];
                this.listenTo(model, `change:${filter.name}`, () => {
                    let last = Espo.Utils.cloneDeep(model.get(filter.name)).pop();
                    let values = [];
                    if (last === all) {
                        values = [all];
                    } else {
                        options.forEach(option => {
                            if (model.get(filter.name).includes(option)) {
                                values.push(option);
                            }
                        });
                        if (values.length === 0) {
                            values = [all];
                        }
                        // delete "all" if it needs
                        if (values.includes(all) && values.length > 1) {
                            values.shift();
                        }

                        if (filter.selfExcludedFieldsMap) {
                            const excludedValue = filter.selfExcludedFieldsMap[last];
                            const key = values.findIndex(item => item === excludedValue)

                            if (key !== -1) {
                                values.splice(key, 1);
                            }
                        }
                    }

                    this.getStorage().set(filter.name, 'OverviewFilter', values);
                    this.model.trigger('overview-filters-changed');

                    model.set(filter.name, values, { trigger: false });
                    view.reRender();
                });
                view.render();
            });
        },

        getAdditionalButtons: function () {
            return [];
        },

        init: function () {
            this.entityType = this.model.name;
            this.scope = this.options.scope || this.entityType;

            this.layoutName = this.options.layoutName || this.layoutName;

            this.detailLayout = this.options.detailLayout || this.detailLayout;

            this.type = this.options.type || this.type;

            this.buttons = this.options.buttons || this.buttons;
            this.buttonList = this.options.buttonList || this.buttonList;
            this.dropdownItemList = this.options.dropdownItemList || this.dropdownItemList;

            this.buttonList = _.clone(this.buttonList);
            this.buttonEditList = _.clone(this.buttonEditList);
            this.dropdownItemList = _.clone(this.dropdownItemList);
            this.dropdownEditItemList = _.clone(this.dropdownEditItemList);

            this.returnUrl = this.options.returnUrl || this.returnUrl;
            this.returnDispatchParams = this.options.returnDispatchParams || this.returnDispatchParams;

            this.exit = this.options.exit || this.exit;
            this.columnCount = this.options.columnCount || this.columnCount;

            Bull.View.prototype.init.call(this);
        },

        isDropdownItemListEmpty: function () {
            if (this.dropdownItemList.length === 0) {
                return true;
            }

            var isEmpty = true;
            this.dropdownItemList.forEach(function (item) {
                if (!item.hidden) {
                    isEmpty = false;
                }
            }, this);

            return isEmpty;
        },

        setup: function () {
            if (typeof this.model === 'undefined') {
                throw new Error('Model has not been injected into record view.');
            }

            this.recordHelper = new ViewRecordHelper(this.defaultFieldStates, this.defaultFieldStates);

            if (this.getUser().isPortal() && !this.portalLayoutDisabled) {
                if (this.getMetadata().get(['clientDefs', this.scope, 'additionalLayouts', this.layoutName + 'Portal'])) {
                    this.layoutName += 'Portal';
                }
            }

            this.once('remove', function () {
                if (this.isChanged) {
                    this.resetModelChanges();
                }
                this.setIsNotChanged();
                $(window).off('scroll.detail-' + this.numId);
            }, this);

            this.numId = Math.floor((Math.random() * 10000) + 1);
            this.id = Espo.Utils.toDom(this.entityType) + '-' + Espo.Utils.toDom(this.type) + '-' + this.numId;

            if (_.isUndefined(this.events)) {
                this.events = {};
            }

            if (!this.editModeDisabled) {
                if ('editModeDisabled' in this.options) {
                    this.editModeDisabled = this.options.editModeDisabled;
                }
            }

            this.buttonsDisabled = this.options.buttonsDisabled || this.buttonsDisabled;

            // for backward compatibility
            // TODO remove in 5.6.0
            if ('buttonsPosition' in this.options && !this.options.buttonsPosition) {
                this.buttonsDisabled = true;
            }

            if ('isWide' in this.options) {
                this.isWide = this.options.isWide;
            }

            if ('sideView' in this.options) {
                this.sideView = this.options.sideView;
            }

            if ('bottomView' in this.options) {
                this.bottomView = this.options.bottomView;
            }

            this.sideDisabled = this.options.sideDisabled || this.sideDisabled;
            this.bottomDisabled = this.options.bottomDisabled || this.bottomDisabled;

            this.readOnlyLocked = this.readOnly;
            this.readOnly = this.options.readOnly || this.readOnly;

            this.inlineEditDisabled = this.inlineEditDisabled || this.getMetadata().get(['clientDefs', this.scope, 'inlineEditDisabled']) || false;

            this.inlineEditDisabled = this.options.inlineEditDisabled || this.inlineEditDisabled;
            this.portalLayoutDisabled = this.options.portalLayoutDisabled || this.portalLayoutDisabled;

            if (!this.getAcl().check(this.entityType, 'create') || !this.getAcl().check(this.entityType, 'edit')) {
                this.buttonEditList = (this.buttonEditList || []).filter(item => {
                    return item.name !== 'saveAndCreate'
                })
            }

            this.setupActionItems();
            this.setupBeforeFinal();

            this.on('after:render', function () {
                this.$detailButtonContainer = this.$el.find('.detail-button-container');
                this.$dropdownItemListButton = this.$detailButtonContainer.find('.dropdown-item-list-button');
            }, this);

            if (this.collection) {
                this.stopListening(this.model, 'destroy');
                this.listenTo(this.model, 'destroy', function () {
                    this.collection.fetch();
                }, this);
            }

            $(window).on('keydown', e => {
                if (e.keyCode === 69 && e.ctrlKey && !$('body').hasClass('modal-open')) {
                    this.hotKeyEdit(e);
                }
                if (e.keyCode === 83 && e.ctrlKey && !$('body').hasClass('modal-open')) {
                    this.hotKeySave(e);
                }
            });

            if (!this.model.isNew() && (this.type === 'detail' || this.type === 'edit')) {
                this.listenTo(this, 'after:render', () => {
                    this.applyOverviewFilters();
                });
                this.listenTo(this.model, 'sync overview-filters-changed', () => {
                    this.applyOverviewFilters();
                });
            }

            if (!this.model.isNew()) {
                this.createOverviewFilters();
            }
        },

        hotKeyEdit: function (e) {
            e.preventDefault();
            if (this.mode !== 'edit') {
                this.actionEdit();
            }
        },

        hotKeySave: function (e) {
            e.preventDefault();
            if (this.mode === 'edit') {
                this.actionSave();
            } else {
                let viewsFields = this.getFieldViews();
                Object.keys(viewsFields).forEach(item => {
                    if (viewsFields[item].mode === "edit") {
                        viewsFields[item].inlineEditSave();
                    }
                });
            }
        },

        setupBeforeFinal: function () {
            this.manageAccess();

            this.attributes = this.model.getClonedAttributes();

            if (this.options.attributes) {
                this.model.set(this.options.attributes);
            }

            this.listenTo(this.model, 'sync', function () {
                this.attributes = this.model.getClonedAttributes();
            }, this);

            this.listenTo(this.model, 'change', function () {
                if (this.mode == 'edit' || this.inlineEditModeIsOn) {
                    this.setIsChanged();
                }
            }, this);

            this.dependencyDefs = _.extend(this.getMetadata().get('clientDefs.' + this.model.name + '.formDependency') || {}, this.dependencyDefs);
            this.initDependancy();

            this.dynamicLogicDefs = _.extend(this.getMetadata().get('clientDefs.' + this.model.name + '.dynamicLogic') || {}, this.dynamicLogicDefs);
            this.initDynamicLogic();

            this.setupFieldLevelSecurity();

            this.initDynamicHandler();
        },

        initDynamicHandler: function () {
            var dynamicHandlerClassName = this.dynamicHandlerClassName || this.getMetadata().get(['clientDefs', this.model.name, 'dynamicHandler']);
            if (dynamicHandlerClassName) {
                this.addReadyCondition(function () {
                    return !!this.dynamicHandler;
                }.bind(this));

                require(dynamicHandlerClassName, function (DynamicHandler) {
                    this.dynamicHandler = new DynamicHandler(this);

                    this.listenTo(this.model, 'change', function (model, o) {
                        if ('onChange' in this.dynamicHandler) {
                            this.dynamicHandler.onChange.call(this.dynamicHandler, model, o);
                        }

                        var changedAttributes = model.changedAttributes();
                        for (var attribute in changedAttributes) {
                            var methodName = 'onChange' + Espo.Utils.upperCaseFirst(attribute);
                            if (methodName in this.dynamicHandler) {
                                this.dynamicHandler[methodName].call(this.dynamicHandler, model, changedAttributes[attribute], o);
                            }
                        }
                    }, this);

                    if ('init' in this.dynamicHandler) {
                        this.dynamicHandler.init();
                    }

                    this.tryReady();
                }.bind(this));
            }
        },

        applyOverviewFilters() {
            // skip overview filters
            if (!this.model || this.getMetadata().get(`scopes.${this.model.urlRoot}.object`) !== true || this.getMetadata().get(`scopes.${this.model.urlRoot}.overviewFilters`) === false) {
                return;
            }

            const fieldFilter = this.getStorage().get('fieldFilter', 'OverviewFilter') || ['allValues'];
            const languageFilter = this.getStorage().get('languageFilter', 'OverviewFilter') || ['allLanguages'];

            $.each(this.getFieldViews(), (name, fieldView) => {
                if (fieldView.model.getFieldParam(name, 'advancedFilterDisabled') === true) {
                    return;
                }

                let fields = this.getFieldManager().getActualAttributeList(fieldView.model.getFieldType(name), name);
                let fieldValues = fields.map(field => fieldView.model.get(field));

                let hide = false;

                if (!fieldFilter.includes('allValues')) {
                    // hide filled
                    if (!hide && fieldFilter.includes('filled')) {
                        hide = fieldValues.every(value => this.isEmptyValue(value));
                    }

                    // hide empty
                    if (!hide && fieldFilter.includes('empty')) {
                        hide = !fieldValues.every(value => this.isEmptyValue(value));
                    }

                    // hide optional
                    if (!hide && fieldFilter.includes('optional')) {
                        hide = this.isRequiredValue(name);
                    }

                    // hide required
                    if (!hide && fieldFilter.includes('required')) {
                        hide = !this.isRequiredValue(name);
                    }
                }

                if (!languageFilter.includes('allLanguages')) {
                    // for languages
                    if (!hide && this.getConfig().get('isMultilangActive') && (this.getConfig().get('inputLanguageList') || []).length) {
                        let fieldLanguage = fieldView.model.getFieldParam(name, 'multilangLocale') || 'main';
                        if (!languageFilter.includes(fieldLanguage)) {
                            hide = true;
                        }
                    }
                }

                this.controlFieldVisibility(fieldView, hide);
            });
        },

        isEmptyValue(value) {
            return value === null || value === '' || (Array.isArray(value) && !value.length);
        },

        isRequiredValue(field) {
            return this.getMetadata().get(['entityDefs', this.scope, 'fields',  field, 'required']) || false
        },

        controlFieldVisibility(field, hide) {
            if (hide) {
                field.hide();
                field.overviewFiltersHidden = true;
            } else if (field.overviewFiltersHidden) {
                field.show();
            }
        },

        setupFinal: function () {
            this.build(this.addCollapsingButtonsToMiddleView);
        },

        addCollapsingButtonsToMiddleView(view) {
            view.listenTo(view, 'after:render', view => {
                let bottom = this.getView('bottom');
                if (bottom && bottom.panelList.length) {
                    let html = `` +
                        `<a class="btn btn-link collapsing-button" data-action="collapseAllPanels">` +
                        `<span class="fas fa-chevron-up"></span>` +
                        `${this.getLanguage().translate('collapseAllPanels', 'labels', 'Global')}` +
                        `</a>` +
                        `<a class="btn btn-link collapsing-button" data-action="expandAllPanels">` +
                        `<span class="fas fa-chevron-down"></span>` +
                        `${this.getLanguage().translate('expandAllPanels', 'labels', 'Global')}` +
                        `</a>`;
                    view.$el.find('.panel-heading:first').append(html);
                }
            });
        },

        setIsChanged: function () {
            this.isChanged = true;
            this.setConfirmLeaveOut(true);
        },

        setIsNotChanged: function () {
            this.isChanged = false;
            this.setConfirmLeaveOut(false);
        },

        actionSave: function () {
            let savingCanceled = false;

            this.listenToOnce(this, 'cancel:save', () => savingCanceled = true);

            const setDetailAndScroll = () => {
                this.setDetailMode();
            };

            if (this.save(setDetailAndScroll, true) && savingCanceled) {
                setDetailAndScroll();
            }
        },

        actionViewPersonalData: function () {
            this.createView('viewPersonalData', 'views/personal-data/modals/personal-data', {
                model: this.model
            }, function (view) {
                view.render();

                this.listenToOnce(view, 'erase', function () {
                    this.clearView('viewPersonalData');
                    this.model.fetch();
                }, this);
            });
        },

        afterSave: function () {
            if (this.isNew) {
                this.notify('Created', 'success');
            } else {
                this.notify('Saved', 'success');
            }
            this.enableButtons();
            this.setIsNotChanged();
        },

        beforeSave: function () {
            this.notify('Saving...');
        },

        beforeBeforeSave: function () {
            this.disableButtons();

            this.model.trigger('before:save');
        },

        afterSaveError: function () {
            this.enableButtons();

            if (this.fetchOnModelAfterSaveError) {
                this.model.fetch();
            }
        },

        afterNotModified: function () {
            var msg = this.translate('notModified', 'messages');
            Espo.Ui.warning(msg, 'warning');
            this.enableButtons();
        },

        afterNotValid: function () {
            this.notify(this.translate('Record cannot be saved'), 'error');
            this.enableButtons();
        },

        errorHandlerDuplicate: function (duplicates) {
            this.notify(false);
            this.createView('duplicate', 'views/modals/duplicate', {
                scope: this.entityType,
                duplicates: duplicates,
            }, function (view) {
                view.render();

                this.listenToOnce(view, 'save', function () {
                    this.model.set('forceDuplicate', true);
                    this.actionSave();
                }.bind(this));

            }.bind(this));
        },

        setReadOnly: function () {
            if (!this.readOnlyLocked) {
                this.readOnly = true;
            }

            var bottomView = this.getView('bottom');
            if (bottomView && 'setReadOnly' in bottomView) {
                bottomView.setReadOnly();
            }

            var sideView = this.getView('side');
            if (sideView && 'setReadOnly' in sideView) {
                sideView.setReadOnly();
            }

            this.getFieldList().forEach(function (field) {
                this.setFieldReadOnly(field);
            }, this);
        },

        setNotReadOnly: function (onlyNotSetAsReadOnly) {
            if (!this.readOnlyLocked) {
                this.readOnly = false;
            }

            var bottomView = this.getView('bottom');
            if (bottomView && 'setNotReadOnly' in bottomView) {
                bottomView.setNotReadOnly();
            }

            var sideView = this.getView('side');
            if (sideView && 'setNotReadOnly' in sideView) {
                sideView.setNotReadOnly();
            }

            this.getFieldList().forEach(function (field) {
                if (onlyNotSetAsReadOnly) {
                    if (this.recordHelper.getFieldStateParam(field, 'readOnly')) return;
                }
                this.setFieldNotReadOnly(field);
            }, this);
        },

        manageAccessEdit: function (second) {
            if (this.isNew) return;

            var editAccess = this.getAcl().checkModel(this.model, 'edit', true);

            if (!editAccess || this.readOnlyLocked) {
                this.readOnly = true;
                this.hideActionItem('edit');
                if (this.duplicateAction) {
                    this.hideActionItem('duplicate');
                }
                if (this.selfAssignAction) {
                    this.hideActionItem('selfAssign');
                }
            } else {
                this.showActionItem('edit');
                if (this.duplicateAction) {
                    this.showActionItem('duplicate');
                }
                if (this.selfAssignAction) {
                    this.hideActionItem('selfAssign');
                    if (this.model.has('assignedUserId')) {
                        if (!this.model.get('assignedUserId')) {
                            this.showActionItem('selfAssign');
                        }
                    }
                }
                if (!this.readOnlyLocked) {
                    if (this.readOnly && second) {
                        this.setNotReadOnly(true);
                    }
                    this.readOnly = false;
                }
            }

            if (editAccess === null) {
                this.listenToOnce(this.model, 'sync', function () {
                    this.manageAccessEdit(true);
                }, this);
            }
        },

        manageAccessDelete: function () {
            if (this.isNew) return;

            var deleteAccess = this.getAcl().checkModel(this.model, 'delete', true);

            if (!deleteAccess) {
                this.hideActionItem('delete');
            } else {
                this.showActionItem('delete');
            }

            if (deleteAccess === null) {
                this.listenToOnce(this.model, 'sync', function () {
                    this.manageAccessDelete();
                }, this);
            }
        },

        manageAccess: function () {
            this.manageAccessEdit();
            this.manageAccessDelete();
        },

        addButton: function (o) {
            var name = o.name;
            if (!name) return;
            for (var i in this.buttonList) {
                if (this.buttonList[i].name == name) {
                    return;
                }
            }
            this.buttonList.push(o);
        },

        addDropdownItem: function (o) {
            var name = o.name;
            if (!name) return;
            for (var i in this.dropdownItemList) {
                if (this.dropdownItemList[i].name == name) {
                    return;
                }
            }
            this.dropdownItemList.push(o);
        },

        enableButtons: function () {
            this.$el.find(".button-container .action").removeAttr('disabled').removeClass('disabled');
            this.$el.find(".button-container .dropdown-toggle").removeAttr('disabled').removeClass('disabled');
        },

        disableButtons: function () {
            this.$el.find(".button-container .action").attr('disabled', 'disabled').addClass('disabled');
            this.$el.find(".button-container .dropdown-toggle").attr('disabled', 'disabled').addClass('disabled');
        },

        removeButton: function (name) {
            for (var i in this.buttonList) {
                if (this.buttonList[i].name == name) {
                    this.buttonList.splice(i, 1);
                    break;
                }
            }
            for (var i in this.dropdownItemList) {
                if (this.dropdownItemList[i].name == name) {
                    this.dropdownItemList.splice(i, 1);
                    break;
                }
            }
            if (this.isRendered()) {
                this.$el.find('.detail-button-container .action[data-action="' + name + '"]').remove();
            }
        },

        convertDetailLayout: function (simplifiedLayout) {
            var layout = [];

            var el = this.options.el || '#' + (this.id);

            for (var p in simplifiedLayout) {
                var panel = {};
                panel.label = this.getLanguage().translate(simplifiedLayout[p].label, 'labels', this.scope) || null;
                if ('customLabel' in simplifiedLayout[p]) {
                    panel.customLabel = simplifiedLayout[p].customLabel;
                }
                panel.name = simplifiedLayout[p].name || 'panel-' + p.toString();
                panel.style = simplifiedLayout[p].style || 'default';
                panel.rows = [];

                if (simplifiedLayout[p].dynamicLogicVisible) {
                    if (this.dynamicLogic) {
                        this.dynamicLogic.defs.panels = this.dynamicLogic.defs.panels || {};
                        this.dynamicLogic.defs.panels[panel.name] = {
                            visible: simplifiedLayout[p].dynamicLogicVisible
                        };
                        this.dynamicLogic.processPanel(panel.name, 'visible');
                    }
                }

                for (var i in simplifiedLayout[p].rows) {
                    var row = [];

                    for (var j in simplifiedLayout[p].rows[i]) {
                        var cellDefs = simplifiedLayout[p].rows[i][j];

                        if (cellDefs == false) {
                            row.push(false);
                            continue;
                        }

                        if (!cellDefs.name) {
                            continue;
                        }

                        var name = cellDefs.name;

                        // remove relation virtual fields
                        let parts = name.split('__');
                        if (parts.length === 2) {
                            if (this.model._relateData) {
                                let relationName = this.getMetadata().get(['entityDefs', this.model._relateData.model.urlRoot, 'links', this.model._relateData.panelName, 'relationName']);
                                if (relationName) {
                                    let relEntity = relationName.charAt(0).toUpperCase() + relationName.slice(1);
                                    if (relEntity !== parts[0]) {
                                        continue;
                                    }
                                }
                            } else {
                                if (!this.model.has(name) && !this.model.has(name + 'Id')) {
                                    continue;
                                }
                            }
                        }

                        var type = cellDefs.type || this.model.getFieldType(name) || 'base';
                        var viewName = cellDefs.view || this.model.getFieldParam(name, 'view') || this.getFieldManager().getViewName(type);

                        var o = {
                            el: el + ' .middle .field[data-name="' + name + '"]',
                            defs: {
                                name: name,
                                params: cellDefs.params || {}
                            },
                            mode: this.fieldsMode
                        };

                        if (this.readOnly) {
                            o.readOnly = true;
                        }

                        if (cellDefs.readOnly) {
                            o.readOnly = true;
                            o.readOnlyLocked = true;
                        }

                        if (this.readOnlyLocked) {
                            o.readOnlyLocked = true;
                        }

                        if (this.inlineEditDisabled || cellDefs.inlineEditDisabled) {
                            o.inlineEditDisabled = true;
                        }

                        var fullWidth = cellDefs.fullWidth || false;
                        if (!fullWidth) {
                            if (simplifiedLayout[p].rows[i].length == 1) {
                                fullWidth = true;
                            }
                        }

                        if (this.recordHelper.getFieldStateParam(name, 'hidden')) {
                            o.disabled = true;
                        }
                        if (this.recordHelper.getFieldStateParam(name, 'hiddenLocked')) {
                            o.disabledLocked = true;
                        }
                        if (this.recordHelper.getFieldStateParam(name, 'readOnly')) {
                            o.readOnly = true;
                        }
                        if (!o.readOnlyLocked && this.recordHelper.getFieldStateParam(name, 'readOnlyLocked')) {
                            o.readOnlyLocked = true;
                        }
                        if (this.recordHelper.getFieldStateParam(name, 'required') !== null) {
                            o.defs.params = o.defs.params || {};
                            o.defs.params.required = this.recordHelper.getFieldStateParam(name, 'required');
                        }
                        if (this.recordHelper.hasFieldOptionList(name)) {
                            o.customOptionList = this.recordHelper.getFieldOptionList(name);
                        }

                        var cell = {
                            name: name + 'Field',
                            view: viewName,
                            field: name,
                            el: el + ' .middle .field[data-name="' + name + '"]',
                            fullWidth: fullWidth,
                            options: o
                        };

                        if ('customLabel' in cellDefs) {
                            cell.customLabel = cellDefs.customLabel;
                        }
                        if ('customCode' in cellDefs) {
                            cell.customCode = cellDefs.customCode;
                        }
                        if ('noLabel' in cellDefs) {
                            cell.noLabel = cellDefs.noLabel;
                        }
                        if ('span' in cellDefs) {
                            cell.span = cellDefs.span;
                        }

                        row.push(cell);
                    }

                    panel.rows.push(row);
                }
                layout.push(panel);
            }
            return this.prepareLayoutAfterConverting(layout);
        },

        prepareLayoutAfterConverting(layout) {
            return layout;
        },

        getGridLayout: function (callback) {
            if (this.gridLayout !== null) {
                callback(this.gridLayout);
                return;
            }

            var gridLayoutType = this.gridLayoutType || 'record';

            if (this.detailLayout) {
                this.gridLayout = {
                    type: gridLayoutType,
                    layout: this.convertDetailLayout(this.detailLayout)
                };
                callback(this.gridLayout);
                return;
            }

            this._helper.layoutManager.get(this.model.name, this.layoutName, function (simpleLayout) {
                this.gridLayout = {
                    type: gridLayoutType,
                    layout: this.convertDetailLayout(simpleLayout)
                };
                callback(this.gridLayout);
            }.bind(this));
        },

        createSideView: function () {
            var el = this.options.el || '#' + (this.id);
            this.createView('side', this.sideView, {
                model: this.model,
                scope: this.scope,
                el: el + ' .side',
                type: this.type,
                readOnly: this.readOnly,
                inlineEditDisabled: this.inlineEditDisabled,
                recordHelper: this.recordHelper,
                recordViewObject: this
            }, view => {
                this.listenTo(view, 'side-width-changed', width => {
                    width = parseInt(width);

                    const content = $('#content');
                    if (content.length) {
                        const contentWidth = Math.floor(content.get(0).getBoundingClientRect().width);
                        const overview = content.find('.overview');

                        overview.outerWidth(Math.floor(contentWidth - $('.catalog-tree-panel').outerWidth() - width));
                    }
                })
            });
        },

        createMiddleView: function (callback) {
            var el = this.options.el || '#' + (this.id);
            this.waitForView('middle');
            this.getGridLayout(function (layout) {
                this.createView('middle', this.middleView, {
                    model: this.model,
                    scope: this.scope,
                    type: this.type,
                    _layout: layout,
                    el: el + ' .middle',
                    layoutData: {
                        model: this.model,
                        columnCount: this.columnCount
                    },
                    recordHelper: this.recordHelper,
                    recordViewObject: this
                }, callback);
            }.bind(this));
        },

        createBottomView: function () {
            var el = this.options.el || '#' + (this.id);
            this.createView('bottom', this.bottomView, {
                model: this.model,
                scope: this.scope,
                el: el + ' .bottom',
                readOnly: this.readOnly,
                type: this.type,
                inlineEditDisabled: this.inlineEditDisabled,
                recordHelper: this.recordHelper,
                recordViewObject: this,
                portalLayoutDisabled: this.portalLayoutDisabled
            }, view => {
                this.listenToOnce(view, 'after:render', () => {
                    let middlePanels = [];
                    if (this.gridLayout && 'layout' in this.gridLayout) {
                        Object.values(this.gridLayout.layout).forEach(panel => {
                            let name = panel.label || panel.customLabel;

                            if (name) {
                                middlePanels.push({title: name, name: panel.name});
                            }
                        });
                    }

                    this.createPanelNavigationView(middlePanels.concat(view.panelList));
                })
            });
        },

        createPanelNavigationView(panelList) {
            let el = this.options.el || '#' + (this.id);
            this.createView('panelDetailNavigation', this.panelNavigationView, {
                panelList: panelList,
                model: this.model,
                scope: this.scope,
                el: el + ' .panel-navigation.panel-left',
            }, function (view) {
                this.listenTo(this, 'after:set-detail-mode', () => {
                    view.reRender();
                });
                view.render();
            });
            this.createView('panelEditNavigation', this.panelNavigationView, {
                panelList: panelList,
                model: this.model,
                scope: this.scope,
                el: el + ' .panel-navigation.panel-right',
            }, function (view) {
                this.listenTo(this, 'after:set-edit-mode', () => {
                    view.reRender();
                });
                view.render();
            });
        },

        build: function (callback) {
            if (!this.sideDisabled && this.sideView) {
                this.createSideView();
            }

            if (this.middleView) {
                this.createMiddleView(callback);
            }

            if (!this.bottomDisabled && this.bottomView) {
                this.createBottomView();
            }
        },

        exitAfterCreate: function () {
            if (this.model.id) {
                var url = '#' + this.scope + '/view/' + this.model.id;

                this.getRouter().navigate(url, {trigger: false});
                this.getRouter().dispatch(this.scope, 'view', {
                    id: this.model.id,
                    rootUrl: this.options.rootUrl
                });
                return true;
            }
        }, /**
         * Called after save or cancel.
         * By default redirects page. Can be orverriden in options.
         * @param {String} after Name of action (save, cancel, etc.) after which #exit is invoked.
         */
        exit: function (after) {
            if (after) {
                var methodName = 'exitAfter' + Espo.Utils.upperCaseFirst(after);
                if (methodName in this) {
                    var result = this[methodName]();
                    if (result) {
                        return;
                    }
                }
            }

            var url;
            if (this.returnUrl) {
                url = this.returnUrl;
            } else {
                if (after == 'delete') {
                    url = this.options.rootUrl || '#' + this.scope;
                    this.getRouter().navigate(url, {trigger: false});
                    this.getRouter().dispatch(this.scope, null, {
                        isReturn: true
                    });
                    return;
                }
                if (this.model.id) {
                    url = '#' + this.scope + '/view/' + this.model.id;

                    if (!this.returnDispatchParams) {
                        this.getRouter().navigate(url, {trigger: false});
                        var options = {
                            id: this.model.id,
                            model: this.model
                        };
                        if (this.options.rootUrl) {
                            options.rootUrl = this.options.rootUrl;
                        }
                        this.getRouter().dispatch(this.scope, 'view', options);
                    }
                } else {
                    url = this.options.rootUrl || '#' + this.scope;
                }
            }

            if (this.returnDispatchParams) {
                var controller = this.returnDispatchParams.controller;
                var action = this.returnDispatchParams.action;
                var options = this.returnDispatchParams.options || {};
                this.getRouter().navigate(url, {trigger: false});
                this.getRouter().dispatch(controller, action, options);
                return;
            }

            this.getRouter().navigate(url, {trigger: true});
        }

    });

});
