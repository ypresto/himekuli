declare module "meteor/react-meteor-data" {
  interface WithTrackerOptions<D, P> {
    getMeteorData: (props: P) => D;
    /** @default true */
    pure?: boolean;
  }

  interface ComponentClass<P, S> {
    new(props: P, context: any): React.Component<P, S>
  }

  export function withTracker<D, P>(
    options: WithTrackerOptions<D, P> | ((props: P) => D)
  ): <S> (WrappedComponent: ComponentClass<P & D, S>) => ComponentClass<P, S>;

  /** @deprecated Use withTracker() instead. */
  export function createContainer<D, P, S>(
    options: WithTrackerOptions<D, P> | ((props: P) => D),
    Component: ComponentClass<P, S>
  ): ComponentClass<P & D, S>;

  interface _ReactMeteorData {
    componentWillMount(): void;
    componentWillUpdate(nextProps: any, nextState: any): void;
    componentWillUnmount(): void;
  }

  export const ReactMeteorData: _ReactMeteorData;
}
