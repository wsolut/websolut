import { EntityManager } from 'typeorm';
import { PageEntity } from '../../pages';
import { ProjectEntity } from '../../projects/project.entity';

export async function seed(em: EntityManager): Promise<void> {
  let project1 = await em.findOneBy(ProjectEntity, { name: 'FickleFlight' });

  if (!project1) {
    project1 = new ProjectEntity({
      name: 'FickleFlight',
      tags: ['figma', 'flight'],
      pages: [
        em.create(PageEntity, {
          path: 'home',
          figmaUrl:
            'https://www.figma.com/design/z0TwzH4KmBjL8WCKA1T8OG/FickleFlight?node-id=1-2&t=He3RpV0DXE60VJ9M-1',
        }),
      ],
    });

    // await em.save(project1);
  }
}
