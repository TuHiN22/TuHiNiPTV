import { Component, computed, inject } from '@angular/core';
import { PortalCollectionContextService } from '@iptvnator/portal/shared/util';
import { WorkspaceContextCategoryViewComponent } from './components/workspace-context-category-view.component';

/**
 * Context panel rendered in the workspace-shell aside for
 * collection-backed workspace pages such as downloads.
 *
 * Reads categories from PortalCollectionContextService (populated by the
 * active routed collection page) and emits
 * category selections back through the same service.
 */
@Component({
    selector: 'app-workspace-collection-context-panel',
    imports: [WorkspaceContextCategoryViewComponent],
    template: `
        <div class="context-column">
            <header class="context-header">
                <div class="context-header__top">
                    <h2>
                        {{
                            selectedCategory()?.category_name ||
                                'Filter by type'
                        }}
                    </h2>
                </div>
                @if (selectedCount() !== null) {
                    <span class="context-header__badge">
                        @if (selectedCount() === 1) {
                            {{ '1 item' }}
                        } @else {
                            {{ selectedCount() }} items
                        }
                    </span>
                }
            </header>

            <div class="context-divider"></div>

            <app-workspace-context-category-view
                [items]="ctx.categories()"
                [selectedCategoryId]="ctx.selectedCategoryId()"
                (categoryClicked)="onCategoryClicked($event)"
            />
        </div>
    `,
    styleUrl: './workspace-context-panel.component.scss',
})
export class WorkspaceCollectionContextPanelComponent {
    readonly ctx = inject(PortalCollectionContextService);

    readonly selectedCategory = computed(() => {
        const categories = this.ctx.categories();
        return categories.find(
            (c) => c.category_id === this.ctx.selectedCategoryId()
        );
    });

    readonly selectedCount = computed(
        () => this.selectedCategory()?.count ?? null
    );

    onCategoryClicked(item: {
        category_id?: string | number;
        id?: string | number;
    }): void {
        const id = String(item.category_id ?? item.id ?? 'all');
        this.ctx.setCategoryId(id);
    }
}
