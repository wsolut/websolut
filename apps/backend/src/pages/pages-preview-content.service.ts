import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from '../services';
import { I18nService } from 'nestjs-i18n';
import { PageEntity } from './page.entity';
import { Config } from '../config';
import { deleteEmptyDir, readJsonFileSync, safeMergeData } from '../utils';
import { PagesService } from './pages.service';
import * as path from 'path';
import * as fs from 'fs';
import { writeJsonFileSync } from '../utils';
import { PagesExportPreviewService } from './pages-export-preview.service';
import { PageContentResponse } from './page-serializer.service';
import * as WebsolutCore from '@wsolut/websolut-core';

export class PageUpdateContentInputDto {
  [id: string]: {
    text: string;
  };
}

@Injectable()
export class PagesPreviewContentService extends BaseService {
  constructor(
    @Inject('CONFIG') readonly config: Config,
    protected readonly i18nService: I18nService,
    private readonly pagesExportPreviewService: PagesExportPreviewService,
    private readonly pagesService: PagesService,
  ) {
    super(i18nService);
  }

  async fetchContent(id: number): Promise<PageContentResponse> {
    const page = await this.pagesService.fetchOne({ where: { id } });

    const websolutManager = new WebsolutCore.Manager({
      figmaToken: page.figmaToken || '-error-',
      figmaFileKey: page.figmaFileKey,
      figmaNodeId: page.figmaNodeId,
      dataDirPath: this.config.dataDirPath,
    });

    websolutManager.loadData(page.contentVariantName);

    const websolutPage = websolutManager.page;

    if (!websolutPage) {
      throw new Error('Figma page data not found');
    }

    const contentData = {};

    Object.keys(websolutPage.document.nodes).forEach((key) => {
      const domxNode = websolutPage.document.nodes[
        key
      ] as WebsolutCore.DomxNode;

      if ((domxNode.text ?? '') !== '') {
        contentData[domxNode.id] = { text: domxNode.text };
      }
    });

    return contentData;
  }

  async updateContent(
    id: number,
    input: PageUpdateContentInputDto,
  ): Promise<PageEntity> {
    const page = await this.pagesService.fetchOne({
      where: { id },
      relations: ['project'],
    });

    const userNodesPath = this.userNodesPath(page);
    let domxNodes = readJsonFileSync(userNodesPath) as Record<string, unknown>;

    if (domxNodes) {
      safeMergeData(domxNodes, input);
    } else {
      domxNodes = input;
    }

    page.hasCommittedChanges = Object.keys(domxNodes).length > 0;

    await this.pagesService.dbSave(page);

    writeJsonFileSync(userNodesPath, domxNodes);

    await this.pagesExportPreviewService.export(page, page.project);

    return page;
  }

  async revertContent(id: number): Promise<PageEntity> {
    const page = await this.pagesService.fetchOne({
      where: { id },
      relations: ['project'],
    });

    page.hasCommittedChanges = false;

    await this.pagesService.dbSave(page);

    const userNodesPath = this.userNodesPath(page);

    if (fs.existsSync(userNodesPath)) {
      fs.rmSync(userNodesPath);

      deleteEmptyDir(path.dirname(userNodesPath));
      deleteEmptyDir(path.dirname(path.dirname(userNodesPath)));
    }

    await this.pagesExportPreviewService.export(page, page.project);

    return page;
  }

  protected userNodesPath(page: PageEntity): string {
    return path.join(
      this.config.dataDirPath,
      page.figmaFileKey,
      page.figmaNodeId,
      WebsolutCore.VARIANTS_DIR_NAME,
      page.contentVariantName,
      'user.domx-nodes.json',
    );
  }
}
