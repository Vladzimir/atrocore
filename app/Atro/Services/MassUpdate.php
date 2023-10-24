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

namespace Atro\Services;

use Atro\Core\Exceptions\NotModified;
use Espo\Core\DataManager;
use Espo\Core\Utils\Util;
use Espo\Services\QueueManagerBase;

class MassUpdate extends QueueManagerBase
{
    public function run(array $data = []): bool
    {
        if (empty($data['entityType']) || empty($data['total']) || empty($data['ids']) || empty($data['input'])) {
            return false;
        }

        $entityType = $data['entityType'];

        $service = $this->getContainer()->get('serviceFactory')->create($entityType);

        foreach ($data['ids'] as $id => $position) {
            $input = json_decode(json_encode($data['input']));
            $input->_isMassUpdate = true;

            $publicData = DataManager::getPublicData('massUpdate')[$entityType] ?? [];

            $massUpdateData = ['total' => $data['total']];
            if (isset($publicData['updated'])) {
                $massUpdateData['updated'] = $publicData['updated'];
            } else {
                $massUpdateData['updated'] = 0;
                $this->updateMassUpdatePublicData($entityType, $massUpdateData);
            }

            try {
                $service->updateEntity($id, $input);
            } catch (NotModified $e) {
            } catch (\Throwable $e) {
                $GLOBALS['log']->error("Update {$data['entityType']} '$id' failed: {$e->getMessage()}");
            }

            $massUpdateData['updated']++;
            $this->updateMassUpdatePublicData($entityType, $massUpdateData);
        }

        if (!empty($data['last'])) {
            $massUpdateData['done'] = Util::generateId();
            $this->updateMassUpdatePublicData($entityType, $massUpdateData);
        }

        return true;
    }

    protected function updateMassUpdatePublicData(string $entityType, ?array $data): void
    {
        $publicData = DataManager::getPublicData('massUpdate')[$entityType] ?? [];
        if (!empty($publicData[$entityType]['done'])) {
            return;
        }

        $publicData[$entityType] = $data;
        DataManager::pushPublicData('massUpdate', $publicData);
    }
}
