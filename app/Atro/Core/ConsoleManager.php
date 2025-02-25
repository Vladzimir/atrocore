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

namespace Atro\Core;

use Atro\Console;
use Atro\Console\AbstractConsole;
use Espo\Core\Utils\Metadata;

class ConsoleManager
{
    protected Container $container;

    public function __construct(Container $container)
    {
        $this->container = $container;
    }

    /**
     * Run console command
     *
     * @param string $command
     */
    public function run(string $command)
    {
        if (!empty($data = $this->getRouteHandler($command))) {
            if (is_a($data['handler'], AbstractConsole::class, true)) {
                (new $data['handler']($this->container))->run($data['data']);
                die();
            }
            AbstractConsole::show('No such console handler as ' . $data['handler'], 2, true);
        } else {
            AbstractConsole::show('No such console command!', 2, true);
        }
    }

    /**
     * Get route handler
     *
     * @param string $command
     *
     * @return array
     */
    protected function getRouteHandler(string $command): array
    {
        // prepare result
        $result = [];

        foreach (self::loadRoutes() as $route => $handler) {
            if ($route == $command) {
                $result = [
                    'handler' => $handler,
                    'data'    => []
                ];
            } elseif (preg_match_all("/\<(.+?)\>/is", $route, $matches)) {
                // prepare parameters
                $parameters = $matches[1];

                // prepare pattern
                $pattern = "/^{$route}$/";
                foreach ($parameters as $parameter) {
                    $pattern = str_replace("<$parameter>", "(.*)", $pattern);
                }

                if (preg_match_all($pattern, $command, $matches)) {
                    $data = [];
                    foreach ($parameters as $k => $name) {
                        $data[$name] = $matches[$k + 1][0];
                    }

                    $result = [
                        'handler' => $handler,
                        'data'    => $data
                    ];
                }
            }
        }

        return $result;
    }

    public static function loadRoutes(): array
    {
        return [
            "refresh translations"         => Console\RefreshTranslations::class,
            "list"                         => Console\ListCommand::class,
            "install demo-project"         => Console\InstallDemoProject::class,
            "clear cache"                  => Console\ClearCache::class,
            "cleanup"                      => Console\Cleanup::class,
            "sql diff --show"              => Console\SqlDiff::class,
            "sql diff --run"               => Console\SqlDiffRun::class,
            "cron"                         => Console\Cron::class,
            "store --refresh"              => Console\StoreRefresh::class,
            "migrate <module> <from> <to>" => Console\Migrate::class,
            "qm <stream> --run"            => Console\QueueManager::class,
            "qm item <id> --run"           => Console\QueueItem::class,
            "notifications --refresh"      => Console\Notification::class,
            "kill daemons"                 => Console\KillDaemons::class,
            "daemon <name> <id>"           => Console\Daemon::class,
            "check updates"                => Console\CheckUpdates::class,
            "pt --run"                     => Console\PseudoTransactionManager::class,
        ];
    }

    /**
     * Get metadata
     *
     * @return Metadata
     */
    protected function getMetadata(): Metadata
    {
        return $this->container->get('metadata');
    }
}
