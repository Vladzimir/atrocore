<div class="row">
    {{#if overviewFilters.length}}
    <div class="col-lg-9 overview-filters-container">
        {{#each overviewFilters}}
        <div class="cell filter-cell" data-name="{{this}}">
            <div class="field" data-name="{{this}}">
                {{{var this ../this}}}
            </div>
        </div>
        {{/each}}
    </div>
    <div class="col-lg-4 col-sm-4 header-buttons-container">
        <div class="header-buttons btn-group pull-right">
            <div class="header-items">
                {{#each items.buttons}}
                <a {{#if link}}href="{{link}}"{{else}}href="javascript:"{{/if}} style="{{cssStyle}}" class="btn btn-{{#if style}}{{style}}{{else}}default{{/if}} action{{#if hidden}} hidden{{/if}}" data-name="{{name}}" data-action="{{action}}"{{#each data}} data-{{@key}}="{{./this}}"{{/each}}>
                    {{#if iconHtml}}{{{iconHtml}}}{{/if}}
                    {{#if html}}{{{html}}}{{else}}{{translate label scope=../../scope}}{{/if}}
                </a>
                {{/each}}
            </div>
        </div>
    </div>
    <h3 style="width: 100%">{{{header}}}</h3>
    {{else}}
    <div>
        <h3>{{{header}}}</h3>
    </div>
    <div class="col-lg-5 col-sm-5 search-container">{{{search}}}</div>
    <div class="col-lg-4 col-sm-4 header-buttons-container">
        <div class="header-buttons btn-group pull-right">
            <div class="header-items">
                {{#each items.buttons}}
                <a {{#if link}}href="{{link}}"{{else}}href="javascript:"{{/if}} style="{{cssStyle}}" class="btn btn-{{#if style}}{{style}}{{else}}default{{/if}} action{{#if hidden}} hidden{{/if}}" data-name="{{name}}" data-action="{{action}}"{{#each data}} data-{{@key}}="{{./this}}"{{/each}}>
                    {{#if iconHtml}}{{{iconHtml}}}{{/if}}
                    {{#if html}}{{{html}}}{{else}}{{translate label scope=../../scope}}{{/if}}
                </a>
                {{/each}}

                {{#if items.actions}}
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">
                        {{translate 'Actions'}} <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu pull-right">
                        {{#each items.actions}}
                        <li class="{{#if hidden}}hidden{{/if}}"><a {{#if link}}href="{{link}}"{{else}}href="javascript:"{{/if}} class="action" style="{{cssStyle}}" data-name="{{name}}" data-action="{{action}}"{{#each data}} data-{{@key}}="{{./this}}"{{/each}}>{{#if html}}{{{html}}}{{else}}{{translate label scope=../../../scope}}{{/if}}</a></li>
                        {{/each}}
                    </ul>
                </div>
                {{/if}}

                {{#if items.dropdown}}
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">
                        <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu pull-right">
                        {{#each items.dropdown}}
                        <li class="{{#if hidden}}hidden{{/if}}"><a {{#if link}}href="{{link}}"{{else}}href="javascript:"{{/if}} class="action" data-name="{{name}}" data-action="{{action}}"{{#each data}} data-{{@key}}="{{./this}}"{{/each}}>{{#if iconHtml}}{{{iconHtml}}} {{/if}}{{#if html}}{{{html}}}{{else}}{{translate label scope=../../../scope}}{{/if}}</a></li>
                        {{/each}}
                    </ul>
                </div>
                {{/if}}
            </div>
        </div>
    </div>
    {{/if}}
</div>

