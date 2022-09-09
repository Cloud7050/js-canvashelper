/* [Imports] */
import { clearDownloads, getDownloads } from "../downloadTracker/storage.js";
import { notifyDownloadsChanged, onDownloadsChanged } from "../messenger.js";
import { getDevStorage, getDevTools, setDevStorage, setDevTools } from "../storage.js";
import { isDevMode, refreshBadge, singularPlural } from "../utilities.js";



/* [Main] */
let downloadsPromise = getDownloads();
let isDevToolsPromise = getDevTools();
let isDevStoragePromise = getDevStorage();

function Popup() {
	let [courseCount, setCourseCount] = React.useState(0);
	let [fileCount, setFileCount] = React.useState(0);

	let [isDevTools, setStateDevTools] = React.useState(false);
	let [isDevStorage, setStateDevStorage] = React.useState(false);

	function refreshDownloads(downloads) {
		let _courseCount = Object.keys(downloads).length;
		setCourseCount(_courseCount);

		let _fileCount = 0;
		for (let courseId in downloads) {
			let trackedFileIds = downloads[courseId];
			_fileCount += Object.keys(trackedFileIds).length;
		}
		setFileCount(_fileCount);
	}

	async function downloadsChangedListener() {
		let downloads = await getDownloads();
		refreshDownloads(downloads);
	}

	React.useEffect(
		() => {
			// Initial load
			downloadsPromise.then(
				(downloads) => refreshDownloads(downloads)
			);
			isDevToolsPromise.then(
				(_isDevTools) => {
					setStateDevTools(_isDevTools);
				}
			);
			isDevStoragePromise.then(
				(_isDevStorage) => {
					setStateDevStorage(_isDevStorage);
				}
			);

			// Listener
			onDownloadsChanged(downloadsChangedListener);
		},
		// Run once on mount, including adding the listener
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	function devToolsClick(_mouseEvent) {
		isDevTools = !isDevTools;
		setStateDevTools(isDevTools);
		setDevTools(isDevTools);
	}

	async function devStorageClick(_mouseEvent) {
		isDevStorage = !isDevStorage;
		setStateDevStorage(isDevStorage);

		await setDevStorage(isDevStorage);
		refreshBadge();

		notifyDownloadsChanged();
		downloadsChangedListener();
	}

	async function clearDownloadsClick(_mouseEvent) {
		await clearDownloads();

		notifyDownloadsChanged();
		downloadsChangedListener();
	}

	let isNoneTracked = (
		courseCount === 0
		&& fileCount === 0
	);
	let skipToolsWarning = isDevTools || isDevMode();
	return <div className="p-3 bg-dark">
		<div className="mb-3 p-3 bg-light border border-3 rounded">
			<h3 className="mb-2">
				Download Tracker
			</h3>
			<div>
				{ isNoneTracked &&
					<>
						Nothing tracked yet. Downloads are tracked as you download course files on Canvas.
					</>
				}
				{ !isNoneTracked &&
					<>
						<b>{fileCount}</b> {singularPlural(fileCount, "file", "files")} currently tracked across <b>{courseCount}</b> {singularPlural(courseCount, "course", "courses")}.
					</>
				}
			</div>
		</div>

		<div className={`p-3 bg-light border border-3 rounded ${isDevTools ? "border-warning" : ""}`}>
			<div>
				<div className="form-check form-switch">
					<input
						id="devTools"
						data-bs-target={skipToolsWarning ? null : "#devToolsModal"}
						data-bs-toggle={skipToolsWarning ? null : "modal"}
						className="mt-1-2 form-check-input"
						type="checkbox"
						checked={isDevTools}

						onClick={skipToolsWarning ? devToolsClick : null}
					/>
					<label
						htmlFor="devTools"
						className="mb-0 h3 form-check-label"
					>
						Dev Tools
					</label>
				</div>
			</div>
			{ isDevTools &&
				<>
					<hr className="my-2" />
					<div className="mb-2">
						<div className="form-check form-switch">
							<input
								id="devStorage"
								className="form-check-input"
								type="checkbox"
								checked={isDevStorage}

								onClick={devStorageClick}
							/>
							<label htmlFor="devStorage" className="form-check-label">Switch to dev storage</label>
						</div>
					</div>
					<div>
						<button
							data-bs-target={isDevStorage ? null : "#clearDownloadsModal"}
							data-bs-toggle={isDevStorage ? null : "modal"}
							className="btn btn-danger btn-sm"

							onClick={isDevStorage ? clearDownloadsClick : null}
						>
							Clear Tracked Downloads
						</button>
					</div>
				</>
			}
		</div>

		<div id="devToolsModal" className="modal fade">
			<div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
				<div className="modal-content">
					<div className="py-2 modal-body">
						Dev tools are more for development purposes. Messing with them if you aren&apos;t sure what they do may irreversibly damage existing data and impact functionality! Are you sure you want to enable dev tools?
					</div>
					<div className="p-1 modal-footer">
						<button
							className="btn btn-warning btn-sm"
							data-bs-dismiss="modal"

							onClick={devToolsClick}
						>
							Enable
						</button>
						<button className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
					</div>
				</div>
			</div>
		</div>

		<div id="clearDownloadsModal" className="modal fade">
			<div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
				<div className="modal-content">
					<div className="py-2 modal-body">
						Extension will forget all Canvas downloads it has tracked you making so far. Files it thinks you haven&apos;t downloaded will be highlighted as new until you redownload them. Proceed?
					</div>
					<div className="p-1 modal-footer">
						<button
							className="btn btn-danger btn-sm"
							data-bs-dismiss="modal"

							onClick={clearDownloadsClick}
						>
							Delete All
						</button>
						<button className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
					</div>
				</div>
			</div>
		</div>
	</div>;
}



let rootDiv = document.querySelector("#root");
let root = ReactDOM.createRoot(rootDiv);
root.render(<Popup />);
