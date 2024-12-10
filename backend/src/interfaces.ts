/**
 * Interface representing the parameters and metrics for rating a software package.
 */
export interface RateParameters {
    /** Measures the contribution diversity. */
    BusFactor: number;

    /** Time taken to calculate the Bus Factor. */
    BusFactorLatency: number;

    /** Measures the responsiveness of maintainers to issues and pull requests. */
    ResponsiveMaintainer: number;

    /** Time taken to measure maintainer responsiveness. */
    ResponsiveMaintainerLatency: number;

    /** Measures how quickly new developers can understand and contribute to the project. */
    RampUp: number;

    /** Time taken to calculate the Ramp Up Time metric. */
    RampUpLatency: number;

    /** Measures the correctness or reliability of the project. */
    Correctness: number;

    /** Time taken to evaluate the Correctness metric. */
    CorrectnessLatency: number;

    /** Measures how compatible the license is with industry or project-specific standards. */
    LicenseScore: number;

    /** Time taken to determine the License Score. */
    LicenseScoreLatency: number;

    /** Measures the use of good practices for dependency pinning (e.g., using exact versions). */
    GoodPinningPractice: number;

    /** Time taken to assess Good Pinning Practices. */
    GoodPinningPracticeLatency: number;

    /** Measures the level of review activity on pull requests. */
    PullRequest: number;

    /** Time taken to calculate the Pull Request metric. */
    PullRequestLatency: number;

    /** Overall score of the package, combining all individual metrics. */
    NetScore: number;

    /** Time taken to compute the Net Score. */
    NetScoreLatency: number;
}
