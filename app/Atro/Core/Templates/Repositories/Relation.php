<?php
/**
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore UG (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

declare(strict_types=1);

namespace Atro\Core\Templates\Repositories;

use Atro\ORM\DB\RDB\Mapper;
use Doctrine\DBAL\ParameterType;
use Espo\Core\ORM\Repositories\RDB;
use Espo\Core\Utils\Util;
use Espo\ORM\Entity;

class Relation extends RDB
{
    public static function buildVirtualFieldName(string $relationName, string $fieldName): string
    {
        return "{$relationName}__{$fieldName}";
    }

    public static function isVirtualRelationField(string $fieldName): array
    {
        if (preg_match_all('/^(.*)\_\_(.*)$/', $fieldName, $matches)) {
            return [
                'relationName' => $matches[1][0],
                'fieldName'    => $matches[2][0]
            ];
        }
        return [];
    }

    public function deleteAlreadyDeleted(Entity $entity): void
    {
        $uniqueColumns = $this->getEntityManager()->getEspoMetadata()->get(['entityDefs', $entity->getEntityType(), 'uniqueIndexes', 'unique_relation']);
        if (empty($uniqueColumns)) {
            throw new \Error('No unique column found.');
        }

        $qb = $this->getEntityManager()->getConnection()->createQueryBuilder();
        $qb->delete($this->getEntityManager()->getConnection()->quoteIdentifier($this->getMapper()->toDb($entity->getEntityType())), 't2');
        $qb->where('t2.deleted = :true');
        $qb->setParameter("true", true, ParameterType::BOOLEAN);
        foreach ($uniqueColumns as $column) {
            if ($column === 'deleted') {
                continue;
            }
            $value = $entity->get(Util::toCamelCase($column));
            $qb->andWhere("t2.{$column} = :{$column}_val");
            $qb->setParameter("{$column}_val", $value, Mapper::getParameterType($value));
        }
        $qb->executeQuery();
    }

    protected function beforeRemove(Entity $entity, array $options = [])
    {
        parent::beforeRemove($entity, $options);

        $this->deleteAlreadyDeleted($entity);
    }
}
