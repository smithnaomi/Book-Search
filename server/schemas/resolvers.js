const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id });
      }
      throw new AuthenticationError("Please log in!");
    },
  },

  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("No user with that email!");
      }

      const pw = await user.isCorrectPassword(password);

      if (!pw) {
        throw new AuthenticationError("Incorrect Password!");
      }

      const token = signToken(user);
      return { token, user };
    },

    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);

      return { token, user };
    },

    saveBook: async (
      parent,
      { authors, description, title, bookId, image, link },
      context
    ) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: bookId },
          {
            $addToSet: {
              savedBooks: [title, authors, description, image, link],
            },
          },
          { new: true, runValidators: true }
        );
      }
      throw new AuthenticationError("Please log in!");
    },

    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user.id },
          { $pull: { savedBooks: bookId } },
          { new: true }
        );
      }
      throw new AuthenticationError("Please log in!");
    },
  },
};

module.exports = resolvers;
