<?php
/**
* AtroCore Software
*
* This source file is available under GNU General Public License version 3 (GPLv3).
* Full copyright and license information is available in LICENSE.txt, located in the root directory.
*
*  @copyright  Copyright (c) AtroCore UG (https://www.atrocore.com)
*  @license    GPLv3 (https://www.gnu.org/licenses/)
*/

declare(strict_types=1);

namespace Atro\Migrations;

use Atro\Core\Migration\Base;

class V1Dot4Dot66 extends Base
{
    public function up(): void
    {
        $this->execute("ALTER TABLE `queue_item` ADD pid VARCHAR(255) DEFAULT NULL COLLATE utf8mb4_unicode_ci");
    }

    public function down(): void
    {
        $this->execute("ALTER TABLE `queue_item` DROP pid");
    }

    protected function execute(string $query): void
    {
        try {
            $this->getPDO()->exec($query);
        } catch (\Throwable $e) {
        }
    }
}
