
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

Espo.define('views/email/fields/compose-from-address', 'views/fields/base', function (Dep) {

    return Dep.extend({

        editTemplate: 'email/fields/compose-from-address/edit',

        data: function () {
            return _.extend({
                list: this.list,
                noSmtpMessage: this.translate('noSmtpSetup', 'messages', 'Email').replace('{link}', '<a href="#Preferences">'+this.translate('Preferences')+'</a>')
            }, Dep.prototype.data.call(this));
        },

        setup: function () {
            Dep.prototype.setup.call(this);
            this.list = [];

            var primaryEmailAddress = this.getUser().get('emailAddress');
            if (primaryEmailAddress) {
                this.list.push(primaryEmailAddress);
            }

            var emailAddressList = this.getUser().get('emailAddressList') || [];
            emailAddressList.forEach(function (item) {
                this.list.push(item);
            }, this);

            this.list = _.uniq(this.list);

            if (this.getConfig().get('outboundEmailIsShared') && this.getConfig().get('outboundEmailFromAddress')) {
                var address = this.getConfig().get('outboundEmailFromAddress');
                if (!~this.list.indexOf(address)) {
                    this.list.push(this.getConfig().get('outboundEmailFromAddress'));
                }
            }
        },
    });

});
