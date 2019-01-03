import React from "react";
import { Provider } from "react-redux";
import createReduxStore from "../../../../redux/store/store";
import initialState from "../../../../redux/store/initialState";
import HomePage, { IHomepageProps } from "./homePage";
import { BrowserRouter as Router } from "react-router-dom";
import { mount, ReactWrapper } from "enzyme";
import { Link } from "react-router-dom";
import { IApplicationState, IProject, ITag, IExportFormat, IConnection } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import CondensedList from "../../common/condensedList/condensedList";
import FilePicker from "../../common/filePicker/filePicker";
import MockFactory from "../../../../common/mockFactory";
import { Store, AnyAction } from "redux";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";

describe("Connection Picker Component", () => {
    let store: Store<IApplicationState> = null;
    let props: IHomepageProps = null;
    let wrapper: ReactWrapper<IHomepageProps> = null;
    let deleteProjectSpy: jest.SpyInstance = null;
    const recentProjects = MockFactory.createTestProjects(2);

    function createComponent(store, props: IHomepageProps): ReactWrapper<IHomepageProps> {
        return mount(
            <Provider store={store}>
                <Router>
                    <HomePage {...props} />
                </Router>
            </Provider>,
        );
    }

    beforeEach(() => {
        const projectServiceMock = ProjectService as jest.Mocked<typeof ProjectService>;
        projectServiceMock.prototype.delete = jest.fn(() => Promise.resolve());

        store = createStore(recentProjects);
        props = createProps();
        deleteProjectSpy = jest.spyOn(props.actions, "deleteProject");

        wrapper = createComponent(store, props);
    });

    it("should render a New Project Link", () => {
        expect(wrapper.find(Link).props().to).toBe("/projects/create");
    });

    it("should call upload when 'Open Project' is clicked", () => {
        const fileUpload = wrapper.find("a.file-upload");
        const filePicker = wrapper.find(FilePicker) as ReactWrapper<{}, {}, FilePicker>;
        const spy = jest.spyOn(filePicker.instance(), "upload");
        fileUpload.simulate("click");
        expect(spy).toBeCalled();
    });

    it("should render a file picker", () => {
        expect(wrapper).not.toBeNull();
        expect(wrapper.find(FilePicker).exists()).toBeTruthy();
    });

    it("should render a list of recent projects", () => {
        expect(wrapper).not.toBeNull();
        if (wrapper.props().recentProjects && wrapper.props().recentProjects.length > 0) {
            expect(wrapper.find(CondensedList).exists()).toBeTruthy();
        }
    });

    it("should delete a project when clicking trash icon", (done) => {
        const store = createStore(recentProjects);
        const props = createProps();
        const wrapper = createComponent(store, props);

        expect(wrapper.find(".recent-project-item").length).toEqual(recentProjects.length);
        wrapper.find(".delete-btn").first().simulate("click");

        // Accept the modal delete warning
        wrapper.find(".confirm-modal button").first().simulate("click");

        setImmediate(() => {
            expect(deleteProjectSpy).toBeCalledWith(recentProjects[0]);
            const updatedStore = store.getState();
            expect(updatedStore.recentProjects.length).toEqual(recentProjects.length - 1);

            done();
        });
    });

    function createProps(): IHomepageProps {
        return {
            recentProjects: [],
            history: {
                length: 0,
                action: null,
                location: null,
                push: jest.fn(),
                replace: jest.fn(),
                go: jest.fn(),
                goBack: jest.fn(),
                goForward: jest.fn(),
                block: jest.fn(),
                listen: jest.fn(),
                createHref: jest.fn(),
            },
            location: {
                hash: null,
                pathname: null,
                search: null,
                state: null,
            },
            actions: (projectActions as any) as IProjectActions,
            match: {
                params: {},
                isExact: true,
                path: `https://localhost:3000/`,
                url: `https://localhost:3000/`,
            },
        };
    }

    function createStore(recentProjects: IProject[]): Store<IApplicationState, AnyAction> {
        const initialState: IApplicationState = {
            currentProject: null,
            appSettings: {
                connection: null,
                devToolsEnabled: false,
            },
            connections: [],
            recentProjects,
        };

        return createReduxStore(initialState);
    }
});
