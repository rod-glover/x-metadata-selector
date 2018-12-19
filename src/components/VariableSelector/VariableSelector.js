import PropTypes from 'prop-types';
import React from 'react';
import Select, { components } from 'react-select';
import { Glyphicon } from 'react-bootstrap';

import memoize from "memoize-one";

import {
  curry,
  flow,
  identity,
  isMatch,
  map,
  filter,
  find,
  pick,
  sortBy,
  uniqBy,
  groupBy,
  toPairs,
  some,
} from 'lodash/fp'

import tap from 'lodash/fp/tap';

import './VariableSelector.css';

const { Option } = components;

const MyOption = props => {
  // console.log('MyOption', props)
  return (
  <Option {...props}>
    <Glyphicon glyph={props.value.multi_year_mean ? 'repeat' : 'star'}/>
    {' '}
    {props.label}
  </Option>
)};


const objectIdMap = new WeakMap();
let objectCount = 0;
function objectId(object){
  if (!objectIdMap.has(object)) objectIdMap.set(object, ++objectCount);
  return objectIdMap.get(object);
}


export default class VariableSelector extends React.Component {
  static propTypes = {
    meta: PropTypes.array,
    constraint: PropTypes.object,
    value: PropTypes.any,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    constraint: {},
  };

  constructor(props) {
    super(props);
    console.log('cons: meta:', objectId(props.meta))
    console.log('cons: constraint:', objectId(props.constraint))
  }

  componentDidMount() {
    console.log('componentDidMount')
  }

  componentDidUpdate(prevProps) {
    console.log('cDU: meta:', objectId(this.props.meta))
    console.log('cDU: constraint:', objectId(this.props.constraint))
    console.log(`componentDidMount: props.meta ${this.props.meta === prevProps.meta ? '===' : '!=='} prevProps.meta`)
    console.log(`componentDidMount: props.constraint ${this.props.constraint === prevProps.constraint ? '===' : '!=='} prevProps.constraint`)
  }

  static contextProps =
    'model_id experiment'.split(' ');
  static variableProps =
    'variable_id variable_name multi_year_mean'.split(' ');

  optionValueToLabel = ({ variable_id, variable_name }) =>
    `${variable_id} - ${variable_name}`;

  // Memoize computation of options list
  // See https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#what-about-memoization

  // TODO: Extract to utility module.
  /**
   * Groups a list by accumulating all items that match on `by` into a single
   * list item containing the `by` value. The result is a list of objects
   * of the following shape:
   *  {
   *    by: <any>,
   *    items: [ <any> ]
   *  }
   *
   *  Implementation note: The use of JSON encoding to manage the group keys
   *  (and, not coincidentally, to pass the bulk of the work off to `groupBy`)
   *  is unsound and potentially inefficient, but very, very convenient. Shame.
   *  Better to use a WeakMap to accumulate the groups.
   */
  groupByGeneral = curry(
    (by, list) => flow(
      groupBy(item => JSON.stringify(by(item))),
      toPairs,
      map(pair => ({ by: JSON.parse(pair[0]), items: pair[1] }))
    )(list)
  );

  // Form the list of all options (without isDisabled property) from the
  // list of metadata. An option item has the following form:
  //
  //  {
  //    value: <object>
  //      The value of the option; exchanged through props.value
  //      and props.onChange.
  //    contexts: [ <object> ]
  //      The contexts in which the option occurs. A context is a
  //      subset of metadata time contents, specified by `contextProps`.
  //      (Contexts are used to determine enabled/disabled status,
  //      but this function is not concerned with that status.)
  //      We could just accumulate a list of metadata items (without
  //      subsetting them), but this paves the way for a more general
  //      treatment which will likely be useful later.
  //    label: <string>
  //      The label for the option that appears in the selector UI.
  //  }
  //
  // This function is memoized because otherwise it would have to reprocess
  // the large list of metadata (props.meta) into options every time this
  // component is rendered, which is every time a selection is made, amongst
  // other cases. Also, this function is potentially called twice per render,
  // depending on the behaviour of the downstream functions (that form
  // constrained options and grouped options).
  //
  // FIXME: It appears that memoization is not working properly.
  // Debug logging in `tap` calls appear to show that the inner function
  // is called more than once per consecutive unique argument. WTF?
  allOptions = memoize(
    meta => flow(
      tap(meta => console.log('allOptions: meta:', objectId(meta))),
      map(m => ({
        context: pick(VariableSelector.contextProps)(m),
        value: pick(VariableSelector.variableProps)(m),
      })),
      this.groupByGeneral(({ value }) => value),
      map(group => (
        {
          contexts: map(item => item.context)(group.items),
          value: group.by,
          label: this.optionValueToLabel(group.by),
        }
      )),
      sortBy('value.variable_id'),
      // tap(m => console.log('allOptions', m)),
    )(meta)
  );

  // Form the list of constrained options from the list of metadata.
  // A constrained options is an option with isDisabled set according to
  // props.constraint. An option is disabled iff the there is no context
  // item for the option that matches the constraint.
  //
  // This function is memoized because it is called on every render and
  // because it may be called more than once per render in downstream
  // functions.
  constrainedOptions = memoize(
    (meta, constraint) => flow(
      tap(meta => console.log('constrainedOptions: meta:', objectId(meta))),
      tap(meta => console.log('constrainedOptions: constraint:', objectId(constraint))),
      this.allOptions,
      map(({ contexts, value, label }) => (
        {
          contexts, value, label,
          isDisabled: !some(
            context => isMatch(constraint, context)
          )(contexts) }
      )),
      // tap(m => console.log('constrainedOptions', m))
    )(meta)
  );

  mymOptions =
    (meta, constraint) =>
      filter(o => o.value.multi_year_mean)(this.constrainedOptions(meta, constraint));

  notMymOptions =
    (meta, constraint) =>
      filter(o => !o.value.multi_year_mean)(this.constrainedOptions(meta, constraint));

  // Is this really worth memoizing?
  options = memoize(
    (meta, constraint) => [
      {
        label: 'Multi-Year Mean Datasets',
        options: this.mymOptions(meta, constraint),
      },
      {
        label: 'Time Series Datasets',
        options: this.notMymOptions(meta, constraint),
      },
    ]
  );

  // Value-exchange functions

  optionFor = value => find({ value })(this.allOptions(this.props.meta));

  handleChange = option => this.props.onChange(option.value);

  render() {
    console.log('render')
    return (
      <Select
        isSearchable
        options={this.options(this.props.meta, this.props.constraint)}
        components={{ Option: MyOption }}
        value={this.optionFor(this.props.value)}
        onChange={this.handleChange}
      />
    );
  }
}
