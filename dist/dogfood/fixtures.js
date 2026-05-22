export function fixtureDefinition(type) {
    switch (type) {
        case "node-package":
            return nodePackage();
        case "vite-react":
            return viteReact();
        case "express-api":
            return expressApi();
        case "nextjs-app":
            return nextApp();
        case "python-package":
            return pythonPackage();
        case "rust-crate":
            return rustCrate();
        case "solana-anchor-structural":
            return solanaAnchor();
    }
}
function nodePackage() {
    return {
        type: "node-package",
        files: [
            [
                "package.json",
                `{"name":"dogfood-node-package","type":"module","scripts":{"typecheck":"tsc --noEmit","test":"vitest run","build":"tsc -p tsconfig.json"},"dependencies":{},"devDependencies":{"typescript":"^5.7.2","vitest":"^2.1.8"}}`
            ],
            [
                "tsconfig.json",
                `{"compilerOptions":{"target":"ES2022","module":"NodeNext","moduleResolution":"NodeNext","strict":true,"outDir":"dist"},"include":["src","test"]}`
            ],
            ["src/index.ts", `export function status(): string { return "ok"; }\n`],
            [
                "test/index.test.ts",
                `import { expect, test } from "vitest";\nimport { status } from "../src/index.js";\ntest("status", () => expect(status()).toBe("ok"));\n`
            ]
        ].map(([path, content]) => ({ path, content }))
    };
}
function viteReact() {
    return {
        type: "vite-react",
        files: [
            [
                "package.json",
                `{"name":"dogfood-vite-react","type":"module","scripts":{"typecheck":"tsc --noEmit","test":"vitest run","build":"vite build"},"dependencies":{"@vitejs/plugin-react":"latest","vite":"latest","react":"latest","react-dom":"latest"},"devDependencies":{"typescript":"^5.7.2","vitest":"^2.1.8"}}`
            ],
            [
                "tsconfig.json",
                `{"compilerOptions":{"jsx":"react-jsx","strict":true,"module":"ESNext","target":"ES2022","moduleResolution":"Bundler"},"include":["src"]}`
            ],
            ["src/App.tsx", `export function App() { return <main>Status: ok</main>; }\n`],
            ["src/main.tsx", `import { App } from "./App";\nconsole.log(App);\n`],
            [
                "src/App.test.tsx",
                `import { expect, test } from "vitest";\nimport { App } from "./App";\ntest("component exists", () => expect(App).toBeTypeOf("function"));\n`
            ]
        ].map(([path, content]) => ({ path, content }))
    };
}
function expressApi() {
    return {
        type: "express-api",
        files: [
            [
                "package.json",
                `{"name":"dogfood-express-api","type":"module","scripts":{"typecheck":"tsc --noEmit","test":"vitest run","build":"tsc -p tsconfig.json"},"dependencies":{"express":"latest"},"devDependencies":{"typescript":"^5.7.2","vitest":"^2.1.8"}}`
            ],
            [
                "tsconfig.json",
                `{"compilerOptions":{"target":"ES2022","module":"NodeNext","moduleResolution":"NodeNext","strict":true,"outDir":"dist"},"include":["src","test"]}`
            ],
            [
                "src/server.ts",
                `import { health } from "./routes/health.js";\nexport function route(path: string) { return path === "/health" ? health() : { status: 404 }; }\n// CORS placeholder for dogfood scanner review.\n// rate limit placeholder for dogfood scanner review.\n// auth/authz comments for scanner/dogfood only.\n`
            ],
            [
                "src/routes/health.ts",
                `export function health() { return { status: 200, body: { ok: true } }; }\n`
            ],
            [
                "test/server.test.ts",
                `import { expect, test } from "vitest";\nimport { route } from "../src/server.js";\ntest("health", () => expect(route("/health")).toEqual({ status: 200, body: { ok: true } }));\n`
            ]
        ].map(([path, content]) => ({ path, content }))
    };
}
function nextApp() {
    return {
        type: "nextjs-app",
        files: [
            [
                "package.json",
                `{"name":"dogfood-nextjs-app","type":"module","scripts":{"typecheck":"tsc --noEmit","test":"node -e \\"console.log('structural')\\"","build":"node -e \\"console.log('structural next build')\\""},"dependencies":{},"devDependencies":{"typescript":"^5.7.2"}}`
            ],
            [
                "tsconfig.json",
                `{"compilerOptions":{"jsx":"preserve","strict":true,"module":"ESNext","target":"ES2022","moduleResolution":"Bundler"},"include":["app"]}`
            ],
            [
                "app/page.tsx",
                `export default function Page() { return <main>Dogfood Next structural fixture</main>; }\n`
            ],
            ["app/api/health/route.ts", `export function GET() { return Response.json({ ok: true }); }\n`]
        ].map(([path, content]) => ({ path, content }))
    };
}
function pythonPackage() {
    return {
        type: "python-package",
        files: [
            [
                "pyproject.toml",
                `[project]\nname = "dogfood-python-package"\nversion = "0.1.0"\n[tool.pytest.ini_options]\npythonpath = ["src"]\n`
            ],
            ["src/dogfood_pkg/__init__.py", `def status():\n    return "ok"\n`],
            [
                "tests/test_status.py",
                `from dogfood_pkg import status\n\ndef test_status():\n    assert status() == "ok"\n`
            ]
        ].map(([path, content]) => ({ path, content }))
    };
}
function rustCrate() {
    return {
        type: "rust-crate",
        files: [
            [
                "Cargo.toml",
                `[package]\nname = "dogfood-rust-crate"\nversion = "0.1.0"\nedition = "2021"\n`
            ],
            [
                "src/lib.rs",
                `pub fn status() -> &'static str { "ok" }\n#[cfg(test)] mod tests { use super::*; #[test] fn status_is_ok() { assert_eq!(status(), "ok"); } }\n`
            ]
        ].map(([path, content]) => ({ path, content }))
    };
}
function solanaAnchor() {
    return {
        type: "solana-anchor-structural",
        files: [
            ["Anchor.toml", `[programs.localnet]\nexample = "11111111111111111111111111111111"\n`],
            [
                "package.json",
                `{"name":"dogfood-solana-anchor-structural","scripts":{"test":"node -e \\"console.log('structural')\\""}}`
            ],
            [
                "programs/example/src/lib.rs",
                `use anchor_lang::prelude::*;\ndeclare_id!("11111111111111111111111111111111");\n#[program] pub mod example { use super::*; pub fn initialize(_ctx: Context<Initialize>) -> Result<()> { Ok(()) } }\n#[derive(Accounts)] pub struct Initialize {}\n`
            ]
        ].map(([path, content]) => ({ path, content }))
    };
}
//# sourceMappingURL=fixtures.js.map