import { store, useGlobalValue } from "./Store";
import { SourceFile } from "./types";
import path from "path";
import { XIcon, DownloadIcon } from "@heroicons/react/solid";
import { fetchAssemblyForFileAtLine } from "./Assembly";
import FileOps from "./FileOps";

function getSourceFileHoverString(sourceFile: SourceFile) {
  return [
    `Path: ${sourceFile.fullname}`,
    `Encoding: ${sourceFile.encoding}`,
    `Last modified: ${new Date(
      sourceFile.last_modified_unix_sec * 1000
    ).toLocaleString()}`,
    `Last modified unixtime: ${sourceFile.last_modified_unix_sec}`,
  ].join("\n");
}

function SourceFileTab(props: {
  sourceFile: SourceFile;
  currentFile: boolean;
  pausedOnFrame: boolean;
}) {
  const sourceCodeState =
    useGlobalValue<typeof store.data.source_code_state>("source_code_state");
  const activeColors = props.currentFile
    ? "bg-gray-800 border-indigo-500 border-t-2 "
    : "bg-gray-900 ";



  const maxCharsToDisplay = 30;
  const fullBasename = path.basename(props.sourceFile.fullname);
  const filenameToDisplay =
    fullBasename.length > maxCharsToDisplay
      ? `${fullBasename.slice(0, maxCharsToDisplay)}...`
      : fullBasename;
  return (
    <div
      title={getSourceFileHoverString(props.sourceFile)}
      className={`${activeColors} flex flex-nowrap whitespace-nowrap h-full mx-1 p-2 items-center space-x-2 text-sm`}
    >
      <button
        className="text-white"
        onClick={() => {
          store.set("fullname_to_render", props.sourceFile.fullname);
        }}
      >
        {filenameToDisplay}
      </button>
      {props.currentFile && props.pausedOnFrame && sourceCodeState === "SOURCE_CACHED" && (
        <button
          title="Fetch assembly"
          className="flex items-center  hover:bg-gray-900 text-xs"
          onClick={() => {
            fetchAssemblyForFileAtLine(
              props.sourceFile.fullname,
              store.data.line_of_source_to_flash
                ? parseInt(store.data.line_of_source_to_flash)
                : null
            );
          }}
        >
          assembly
        </button>
      )}
      {props.currentFile &&
        props.pausedOnFrame &&
        sourceCodeState === "ASM_AND_SOURCE_CACHED" && (
          <button
            title="Clear assembly"
            className="flex items-center flex-nowrap whitespace-nowrap hover:bg-gray-900 text-xs"
            onClick={() => {
              FileOps.clearCachedAssemblyForFile(props.sourceFile.fullname);
            }}
          >
            clear asm
          </button>)}
      {!props.currentFile && <button
        className="hover:bg-red-600"
        title='close'
        onClick={() => {
          const filteredSourceFiles = store.data.cachedSourceFiles.filter(
            (sf) => sf.fullname !== props.sourceFile.fullname
          );
          // store.set<typeof store.data.cachedSourceFiles>(
          //   "cachedSourceFiles",
          //   filteredSourceFiles
          // );
          store.set<typeof store.data.fullname_to_render>(
            "fullname_to_render",
            filteredSourceFiles[0].fullname
          );
        }}
      >
        <XIcon className="icon" />
      </button>}
    </div>
  );
}

export function SourceFileTabs() {
  const sourceFiles =
    useGlobalValue<typeof store.data.cachedSourceFiles>("cachedSourceFiles");

  const fullnameToRender =
    useGlobalValue<typeof store.data.fullname_to_render>("fullname_to_render");

  const pausedOnFrame =
    useGlobalValue<typeof store.data.paused_on_frame>("paused_on_frame");

  return (
    <div
      className="bg-black space-x-1 flex-nowrap flex h-8 w-full overflow-x-scroll overflow-y-hidden subtle-scrollbar"
      style={{ scrollbarWidth: "thin" }}
    >
      {sourceFiles.map((sf) => (
        <SourceFileTab
          key={sf.fullname}
          sourceFile={sf}
          currentFile={sf.fullname === fullnameToRender}
          pausedOnFrame={pausedOnFrame?.fullname === fullnameToRender}
        />
      ))}
    </div>
  );
}
