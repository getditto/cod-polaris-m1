import { Config } from './config.js'

// For now, treat this as the main() of the application
export class Autonomy {
    config: Config
    constructor(config: Config) {
        this.config = config
    }

    async main(): Promise<void> {}
}
