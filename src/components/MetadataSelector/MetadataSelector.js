import PropTypes from 'prop-types';
import React from 'react';
import Select from 'react-select';

import memoize from 'memoize-one';

import {
  assign,
  flow,
  constant,
  identity,
  map,
  find,
  sortBy,
  tap,
  isEqual,
} from 'lodash/fp';
import { groupByGeneral } from '../../utils/fp';

import objectId from '../../debug-utils/object-id';

import './MetadataSelector.css';

export default class MetadataSelector extends React.Component {
  static propTypes = {
    meta: PropTypes.array.isRequired,
    // List of metadata items the selector will build its options from.

    getOptionValue: PropTypes.func.isRequired,
    // Maps a metadata item to the `value` property of an option.
    // This function can map many metadata items to the same value;
    // MetadataSelector collects all metadata items with the same
    // value into a single option.

    getOptionLabel: PropTypes.func,
    // Maps an option to the label (a string) for that option.

    getOptionIsDisabled: PropTypes.func,
    // Maps an option to a value for its isDisabled property.
    // Typically makes use of option.context to determine this.
    
    groupOptions: PropTypes.func,
    // Maps the raw option list to a grouped options list for Select.

    components: PropTypes.any,

    value: PropTypes.any,
    // The currently selected option.

    onChange: PropTypes.func,
    // Called when a different option is selected.
  };

  static defaultProps = {
    getOptionLabel: option => option.value.toString(),
    getOptionIsDisabled: constant(false),
    groupOptions: identity,
  };

  constructor(props) {
    super(props);
    console.log('MetadataSelector.cons: meta:', objectId(props.meta))
  }

  componentDidMount() {
    console.log('MetadataSelector.componentDidMount')
  }

  componentDidUpdate(prevProps) {
    console.log('MetadataSelector.cDU: meta:', objectId(this.props.meta))
    console.log(`MetadataSelector.componentDidMount: props.meta ${this.props.meta === prevProps.meta ? '===' : '!=='} prevProps.meta`)
  }

  // Memoize computation of options list
  // See https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#what-about-memoization

  // Form the list of all options (without isDisabled property) from the
  // list of metadata. An option item has the following form:
  //
  //  {
  //    value: <object>
  //      The value of the option; exchanged through props.value
  //      and props.onChange.
  //    contexts: [ <object> ]
  //      The contexts in which the option occurs. A context is a
  //      metadata item from which an equal option value is generated.
  //      (Contexts are used to determine enabled/disabled status,
  //      but this function is not concerned with that status.)
  //    label: <string>
  //      The label for the option that appears in the selector UI.
  //  }
  //
  // This function is memoized because otherwise it would have to reprocess
  // the large list of metadata (`props.meta`) into options every time this
  // component is rendered, which, amongst other cases, is every time a
  // selection is made. Also, this function is potentially called multiple
  // times per render, depending on the behaviour of downstream functions
  // such as `constrainedOptions` and `props.groupOptions`.
  //
  // FIXME: It appears that memoization is not working properly.
  // Debug logging in `tap` calls appear to show that the inner function
  // is called more than once per consecutive unique argument. WTF?
  allOptions = memoize(
    (getOptionValue, getOptionLabel, meta) =>
      flow(
        tap(meta => console.log('MetadataSelector.allOptions: meta:', objectId(meta))),
        map(m => ({
          context: m,
          value: getOptionValue(m),
        })),
        groupByGeneral(({ value }) => value),
        map(group => ({
            contexts: map(item => item.context)(group.items),
            value: group.by,
        })),
        map(option => assign(option, { label: getOptionLabel(option) })),
        sortBy('label'),
        // tap(m => console.log('MetadataSelector.allOptions', m)),
      )(meta)
  );

  // Form the list of constrained options from the list of metadata.
  // A constrained option is an option with isDisabled set according to
  // `props.getOptionIsDisabled`.
  //
  // TODO: memoize by parameterizing on meta, getOptionIsDisabled
  constrainedOptions =
    meta => flow(
      tap(meta => console.log('MetadataSelector.constrainedOptions: meta:', objectId(meta))),
      map(option =>
        assign(option, { isDisabled: this.props.getOptionIsDisabled(option) })),
      // tap(m => console.log('MetadataSelector.constrainedOptions', m))
    )(
      this.allOptions(
        this.props.getOptionValue,
        this.props.getOptionLabel,
        meta
      )
    );

  // Form the grouped options from the constrained options.
  groupedOptions = meta =>
    this.props.groupOptions(this.constrainedOptions(meta));

  // Value-exchange functions

  optionFor = value => find(
    option => isEqual(option.value, value),
    this.constrainedOptions(this.props.meta)
  );

  handleChange = option => this.props.onChange(option.value);

  render() {
    console.log('MetadataSelector.render')
    // TODO: Pass through all the Select props.
    return (
      <Select
        isSearchable
        options={this.groupedOptions(this.props.meta)}
        components={this.props.components}
        value={this.optionFor(this.props.value)}
        onChange={this.handleChange}
      />
    );
  }
}
