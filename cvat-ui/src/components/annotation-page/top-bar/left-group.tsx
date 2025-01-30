import React, { useEffect, useState } from 'react';
import { Col } from 'antd/lib/grid';
import Icon, {
    StopOutlined, CheckCircleOutlined, LoadingOutlined, SaveOutlined,
} from '@ant-design/icons';
import Modal from 'antd/lib/modal';
import Button from 'antd/lib/button';
import Text from 'antd/lib/typography/Text';

import { UndoIcon, RedoIcon } from 'icons';
import { ActiveControl, ToolsBlockerState } from 'reducers';
import { registerComponentShortcuts } from 'actions/shortcuts-actions';
import AnnotationMenuComponent from 'components/annotation-page/top-bar/annotation-menu';
import CVATTooltip from 'components/common/cvat-tooltip';
import { ShortcutScope } from 'utils/enums';
import { subKeyMap } from 'utils/component-subkeymap';
import GlobalHotKeys, { KeyMap } from 'utils/mousetrap-react';
import SaveAnnotationsButton from './save-annotations-button';

interface Props {
    saving: boolean;
    undoAction?: string;
    redoAction?: string;
    undoShortcut: string;
    redoShortcut: string;
    drawShortcut: string;
    switchToolsBlockerShortcut: string;
    toolsBlockerState: ToolsBlockerState;
    activeControl: ActiveControl;
    keyMap: KeyMap;
    onUndoClick(): void;
    onRedoClick(): void;
    onFinishDraw(): void;
    onSwitchToolsBlockerState(): void;
    onSaveForSamurai(): void; // Function to save first-frame annotations differently
}

const componentShortcuts = {
    UNDO: {
        name: 'Undo action',
        description: 'Cancel the latest action related with objects',
        sequences: ['ctrl+z'],
        scope: ShortcutScope.ANNOTATION_PAGE,
    },
    REDO: {
        name: 'Redo action',
        description: 'Cancel undo action',
        sequences: ['ctrl+shift+z', 'ctrl+y'],
        scope: ShortcutScope.ANNOTATION_PAGE,
    },
    SWITCH_TOOLS_BLOCKER_STATE: {
        name: 'Switch algorithm blocker',
        description: 'Postpone running the algorithm for interaction tools',
        sequences: ['tab'],
        scope: ShortcutScope.STANDARD_WORKSPACE,
    },
};

registerComponentShortcuts(componentShortcuts);

function LeftGroup(props: Props): JSX.Element {
    const {
        saving,
        keyMap,
        undoAction,
        redoAction,
        undoShortcut,
        redoShortcut,
        drawShortcut,
        switchToolsBlockerShortcut,
        activeControl,
        toolsBlockerState,
        onUndoClick,
        onRedoClick,
        onFinishDraw,
        onSwitchToolsBlockerState,
        onSaveForSamurai,
    } = props;

    const [frame, setFrame] = useState<number>(0); // Store the current frame number

    // Function to get the current frame from the UI
    const updateFrameNumber = () => {
        const frameInput = document.querySelector('.cvat-player-frame-selector [role="spinbutton"]');
        if (frameInput) {
            const frameValue = frameInput.getAttribute('aria-valuenow');
            if (frameValue) {
                setFrame(Number(frameValue));
            }
        }
    };

    useEffect(() => {
        updateFrameNumber(); // Run frame update when the component mounts
        const observer = new MutationObserver(updateFrameNumber);
        const target = document.querySelector('.cvat-player-frame-selector');
        if (target) {
            observer.observe(target, { attributes: true, subtree: true });
        }
        return () => observer.disconnect();
    }, []);

    const includesDoneButton = [
        ActiveControl.DRAW_POLYGON,
        ActiveControl.DRAW_POLYLINE,
        ActiveControl.DRAW_POINTS,
        ActiveControl.AI_TOOLS,
        ActiveControl.OPENCV_TOOLS,
    ].includes(activeControl);

    const includesToolsBlockerButton =
        [ActiveControl.OPENCV_TOOLS, ActiveControl.AI_TOOLS].includes(activeControl) && toolsBlockerState.buttonVisible;

    const handlers: Record<keyof typeof componentShortcuts, (event?: KeyboardEvent) => void> = {
        UNDO: (event: KeyboardEvent | undefined) => {
            event?.preventDefault();
            if (undoAction) {
                onUndoClick();
            }
        },
        REDO: (event: KeyboardEvent | undefined) => {
            event?.preventDefault();
            if (redoAction) {
                onRedoClick();
            }
        },
        SWITCH_TOOLS_BLOCKER_STATE: (event: KeyboardEvent | undefined) => {
            event?.preventDefault();
            onSwitchToolsBlockerState();
        },
    };

    return (
        <>
            <GlobalHotKeys keyMap={subKeyMap(componentShortcuts, keyMap)} handlers={handlers} />
            {saving && (
                <Modal
                    open
                    destroyOnClose
                    className='cvat-saving-job-modal'
                    closable={false}
                    footer={[]}
                >
                    <Text>CVAT is saving your annotations, please wait </Text>
                    <LoadingOutlined />
                </Modal>
            )}
            <Col className='cvat-annotation-header-left-group'>
                <AnnotationMenuComponent />

                {/* Save for Samurai Button (Only Active on Frame 0) */}
                <CVATTooltip overlay='Save annotations for Samurai (only on first frame)'>
                    <Button
                        type='link'
                        className='cvat-annotation-header-save-samurai-button cvat-annotation-header-button'
                        onClick={onSaveForSamurai}
                        disabled={frame !== 0} // Disable button if not on the first frame
                        style={{ opacity: frame === 0 ? 1 : 0.5 }} // Dim the button if inactive
                    >
                        <SaveOutlined />
                        Samurai
                    </Button>
                </CVATTooltip>

                {/* Standard Save Button */}
                <SaveAnnotationsButton />

                {/* Undo Button */}
                <CVATTooltip overlay={`Undo: ${undoAction} ${undoShortcut}`}>
                    <Button
                        style={{ pointerEvents: undoAction ? 'initial' : 'none', opacity: undoAction ? 1 : 0.5 }}
                        type='link'
                        className='cvat-annotation-header-undo-button cvat-annotation-header-button'
                        onClick={onUndoClick}
                    >
                        <Icon component={UndoIcon} />
                        <span>Undo</span>
                    </Button>
                </CVATTooltip>

                {/* Redo Button */}
                <CVATTooltip overlay={`Redo: ${redoAction} ${redoShortcut}`}>
                    <Button
                        style={{ pointerEvents: redoAction ? 'initial' : 'none', opacity: redoAction ? 1 : 0.5 }}
                        type='link'
                        className='cvat-annotation-header-redo-button cvat-annotation-header-button'
                        onClick={onRedoClick}
                    >
                        <Icon component={RedoIcon} />
                        Redo
                    </Button>
                </CVATTooltip>

                {/* Done Button */}
                {includesDoneButton ? (
                    <CVATTooltip overlay={`Press "${drawShortcut}" to finish`}>
                        <Button type='link' className='cvat-annotation-header-done-button cvat-annotation-header-button' onClick={onFinishDraw}>
                            <CheckCircleOutlined />
                            Done
                        </Button>
                    </CVATTooltip>
                ) : null}

                {/* Block AI Tools Button */}
                {includesToolsBlockerButton ? (
                    <CVATTooltip overlay={`Press "${switchToolsBlockerShortcut}" to postpone running the algorithm `}>
                        <Button
                            type='link'
                            className={`cvat-annotation-header-block-tool-button cvat-annotation-header-button ${
                                toolsBlockerState.algorithmsLocked ? 'cvat-button-active' : ''
                            }`}
                            onClick={onSwitchToolsBlockerState}
                        >
                            <StopOutlined />
                            Block
                        </Button>
                    </CVATTooltip>
                ) : null}
            </Col>
        </>
    );
}

export default React.memo(LeftGroup);
