<?php
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

namespace Espo\Core\Utils\Database\Orm\Fields;

use Atro\ORM\DB\RDB\Query\QueryConverter;
use Espo\Core\Utils\Util;

class Currency extends Base
{
    protected function load($fieldName, $entityName)
    {
        $converedFieldName = $fieldName . 'Converted';

        $currencyColumnName = Util::toUnderScore($fieldName);

        $alias = $fieldName . 'CurrencyRate';

        $d = [
            $entityName => [
                'fields' => [
                    $fieldName => [
                        'type' => 'float',
                        'orderBy' => $converedFieldName . ' {direction}'
                    ]
                ]
            ]
        ];

        $params = $this->getFieldParams($fieldName);

        // prepare required
        if (!empty($params['required'])) {
            $d[$entityName]['fields'][$fieldName]['required'] = true;
        }

        if (!empty($params['notStorable'])) {
            $d[$entityName]['fields'][$fieldName]['notStorable'] = true;
        } else {
            $d[$entityName]['fields'][$fieldName . 'Converted'] = [
                'type' => 'float',
                'select' => QueryConverter::TABLE_ALIAS . "." . $currencyColumnName . " * {$alias}.rate" ,
                'where' =>
                [
                        "=" => Util::toUnderScore($entityName) . "." . $currencyColumnName . " * {$alias}.rate = {value}",
                        ">" => Util::toUnderScore($entityName) . "." . $currencyColumnName . " * {$alias}.rate > {value}",
                        "<" => Util::toUnderScore($entityName) . "." . $currencyColumnName . " * {$alias}.rate < {value}",
                        ">=" => Util::toUnderScore($entityName) . "." . $currencyColumnName . " * {$alias}.rate >= {value}",
                        "<=" => Util::toUnderScore($entityName) . "." . $currencyColumnName . " * {$alias}.rate <= {value}",
                        "<>" => Util::toUnderScore($entityName) . "." . $currencyColumnName . " * {$alias}.rate <> {value}",
                        "IS NULL" => Util::toUnderScore($entityName) . "." . $currencyColumnName . ' IS NULL',
                        "IS NOT NULL" => Util::toUnderScore($entityName) . "." . $currencyColumnName . ' IS NOT NULL'
                ],
                'notStorable' => true,
                'orderBy' => $converedFieldName . " {direction}"
            ];
        }

        return $d;
    }
}
