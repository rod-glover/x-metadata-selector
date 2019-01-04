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
  flatMap,
  find,
  sortBy,
  some,
  tap,
  isEqual,
  isUndefined,
  isArray,
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

    arrangeOptions: PropTypes.func,
    // Arranges options for consumption by Select.
    // This may mean sorting options, grouping options (as provided for
    // by Select), or any other operation(s) that arrange the options
    // for presentation in Select.

    components: PropTypes.any,

    value: PropTypes.any,
    // The currently selected option.

    onChange: PropTypes.func,
    // Called when a different option is selected.

    replaceInvalidValue: PropTypes.func,
    // Called when value passed in is not a valid value.
    // Called with list of all options.
    // Must return a valid value.
    // Beware: If you return an invalid value from this, you're screwed.
    
    debugValue: PropTypes.any,
  };

  static defaultProps = {
    getOptionLabel: option => option.value.toString(),
    getOptionIsDisabled: constant(false),
    arrangeOptions: options => sortBy('label')(options),
    replaceInvalidValue: options => {
      console.log(`replaceInvalidValue: options`, options)
      const allOptions =
        options[0] && isArray(options[0].options) ?
        flatMap('options')(options) :
        options;
      console.log(`replaceInvalidValue: allOptions`, allOptions)
      const firstEnabledOption = find({ isDisabled: false }, allOptions);
      console.log(`replaceInvalidValue: firstEnabledOption`, firstEnabledOption)
      return firstEnabledOption && firstEnabledOption.value;
    },
    // Replace with first enabled option.
    debugValue: '',
  };

  constructor(props) {
    super(props);
    console.log(`MetadataSelector[${this.props.debugValue}].cons: meta:`, objectId(props.meta), props.meta)
  }

  componentDidMount() {
    console.log(`MetadataSelector[${this.props.debugValue}].componentDidMount`)
  }

  componentDidUpdate(prevProps) {
    console.log(`MetadataSelector[${this.props.debugValue}].cDU: meta:`, objectId(this.props.meta))
    console.log(`MetadataSelector[${this.props.debugValue}].componentDidMount: props.meta ${this.props.meta === prevProps.meta ? '===' : '!=='} prevProps.meta`)
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
  // such as `constrainedOptions` and `props.arrangeOptions`.
  //
  // FIXME: It appears that memoization is not working properly.
  // Debug logging in `tap` calls appear to show that the inner function
  // is called more than once per consecutive unique argument. WTF?
  allOptions = memoize(
    (getOptionValue, getOptionLabel, meta) =>
      flow(
        tap(meta => console.log(`MetadataSelector[${this.props.debugValue}].allOptions: meta:`, objectId(meta), meta)),
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
        // tap(m => console.log(`MetadataSelector[${this.props.debugValue}].allOptions`, m)),
      )(meta)
  );

  // Form the list of constrained options from the list of metadata.
  // A constrained option is an option with isDisabled set according to
  // `props.getOptionIsDisabled`.
  constrainedOptions = memoize(
    (getOptionIsDisabled, meta) => flow(
      tap(options => {
        console.log(`MetadataSelector[${this.props.debugValue}].constrainedOptions: meta:`, objectId(meta), meta, 'getOptionIsDisabled:', objectId(getOptionIsDisabled));
        console.log(`MetadataSelector[${this.props.debugValue}].constrainedOptions: options:`, objectId(options), options);
      }),
      map(option =>
        assign(option, { isDisabled: getOptionIsDisabled(option) })),
      tap(options => console.log(`MetadataSelector[${this.props.debugValue}].constrainedOptions: result`, options))
    )(
      // Can't curry a memoized function; have to put it into the flow manually
      this.allOptions(
        this.props.getOptionValue,
        this.props.getOptionLabel,
        meta
      )
    )
  );

  // Value-exchange functions

  isValidValue = value => some(
    option => !option.isDisabled && isEqual(option.value, value)
  )(this.constrainedOptions(this.props.getOptionIsDisabled, this.props.meta));

  optionFor = value => find(
    option => isEqual(option.value, value),
    this.constrainedOptions(this.props.getOptionIsDisabled, this.props.meta)
  );

  handleChange = option => this.props.onChange(option.value);

  render() {
    console.log(`MetadataSelector[${this.props.debugValue}].render`)
    // TODO: Pass through all the Select props.

    console.log(`MetadataSelector[${this.props.debugValue}].render: arrangedOptions: meta:`, objectId(this.props.meta), this.props.meta)
    const arrangedOptions =
      this.props.arrangeOptions(
        this.constrainedOptions(
          this.props.getOptionIsDisabled,
          this.props.meta,
        ));
    console.log(`MetadataSelector[${this.props.debugValue}].render: arrangedOptions: result:`, arrangedOptions)


    let valueToUse = this.props.value;
    if (!this.isValidValue(valueToUse)) {
      console.log(`MetadataSelector[${this.props.debugValue}].render: valueToUse`)
      valueToUse = this.props.replaceInvalidValue(
        // this.constrainedOptions(this.props.getOptionIsDisabled, this.props.meta)
        arrangedOptions
      );
      this.props.onChange(valueToUse);
    }

    console.log(`MetadataSelector[${this.props.debugValue}].render: return`)
    return (
      <Select
        isSearchable
        options={arrangedOptions}
        components={this.props.components}
        value={this.optionFor(valueToUse)}
        onChange={this.handleChange}
      />
    );
  }
}
