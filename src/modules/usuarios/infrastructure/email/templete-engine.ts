import * as fs from "fs/promises";
import * as path from "path";

export class TemplateEngine {

    static async render(
        template: string,
        variables: Record<string, string>,
    ): Promise<string> {

        const ruta = path.join(
            __dirname,
            "templates",
            template,
        );

        let html = await fs.readFile(ruta, "utf8");

        for (const [key, value] of Object.entries(variables)) {

            html = html.replaceAll(
                `{{${key}}}`,
                value,
            );

        }

        return html;
    }

}