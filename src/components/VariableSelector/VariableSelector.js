import PropTypes from 'prop-types';
import React from 'react';
import Select from 'react-select';

import flow from 'lodash/fp/flow';
import identity from 'lodash/fp/identity';
import map from 'lodash/fp/map';
import join from 'lodash/fp/join';
import pick from 'lodash/fp/pick';
import sortBy from 'lodash/fp/sortBy';
import uniqBy from 'lodash/fp/uniqBy';

import './VariableSelector.css';

export default class VariableSelector extends React.Component {
  static propTypes = {
    meta: PropTypes.array,
  };

  static variable_props =
    'variable_id variable_name multi_year_mean'.split(' ');

  // concatProps = obj => flow(map(identity), join(' '))(obj);
  optionValueToLabel = ({ variable_id, variable_name, multi_year_mean }) =>
    `(${multi_year_mean ? '' : 'not '}MYM) ${variable_id} - ${variable_name}`;
  getOptionLabel = option => this.optionValueToLabel(option.value);

  render() {
    const options = flow(
      uniqBy(this.optionValueToLabel),
      map(m => (
        { value: pick(VariableSelector.variable_props)(m) }
      )),
      sortBy('value.variable_id'),
    )(this.props.meta);

    return (
      <Select
        isSearchable
        options={options}
        getOptionLabel={this.getOptionLabel}
      />
    );
  }
}
